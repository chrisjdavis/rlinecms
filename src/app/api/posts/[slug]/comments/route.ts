import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import rateLimit from 'next-rate-limit';
import * as z from "zod"
import { commentRepository } from '@/lib/repositories/commentRepository'
import { postRepository } from '@/lib/repositories/postRepository';
import { userPreferenceRepository } from '@/lib/repositories/userPreferenceRepository';
import { logUserActivity } from '@/lib/activityLog';

const commentLimiter = rateLimit({
  interval: 10 * 60 * 1000, // 10 minutes
  uniqueTokenPerInterval: 1000, // Max 1000 unique users per interval
});

// Define a type for the comment structure returned by Prisma
type CommentWithExtras = {
  id: string;
  content: string;
  createdAt: string | Date;
  author?: { id: string; name?: string | null; username?: string | null; avatar?: string | null } | null;
  reactions: { id: string; type: string; userId: string }[];
  replies: CommentWithExtras[];
  isAuthor?: boolean;
};

const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional().nullable()
})

// GET: Fetch all comments for a post (public)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Removed session check for GET requests to allow public access
    const { slug } = await context.params
    const post = await postRepository.findBySlug(slug, {
      select: { id: true, authorId: true },
    });
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    const comments = await commentRepository.findAll({
      where: { postId: post.id, parentId: null },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true } },
        reactions: true,
        replies: {
          include: {
            author: { select: { id: true, name: true, username: true, avatar: true } },
            reactions: true,
            replies: {
              include: {
                author: { select: { id: true, name: true, username: true, avatar: true } },
                reactions: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    }) as unknown as CommentWithExtras[];

    function addIsAuthorFlag(comment: CommentWithExtras): CommentWithExtras & { isAuthor: boolean; replies: (CommentWithExtras & { isAuthor: boolean })[] } {
      const isAuthor = comment.author?.id === post!.authorId;
      const replies: (CommentWithExtras & { isAuthor: boolean })[] = comment.replies.map(addIsAuthorFlag);
      return { ...comment, isAuthor, replies };
    }

    const commentsWithFlag = comments.map(addIsAuthorFlag);
    return NextResponse.json(commentsWithFlag);
  } catch {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

// POST: Add a new comment or reply (auth required)
export async function POST(req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  // Rate limit by user id (mock NextRequest)
  const headersObj = new Headers({ 'x-user-id': session.user.id });
  // @ts-expect-error Only headers are used for unique token
  const headers = commentLimiter.checkNext({
    headers: headersObj,
  }, 10);
  if (headers.get('x-ratelimit-remaining') === '0') {
    return NextResponse.json(
      { message: 'Too many comments, please try again later.' },
      { status: 429, headers }
    );
  }
  const { content, parentId } = await req.json();
  const parsed = commentSchema.safeParse({ content, parentId });
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid input', errors: parsed.error.flatten() }, { status: 400 });
  }
  const post = await postRepository.findBySlug(slug, {
    select: { id: true, authorId: true },
  });
  if (!post) {
    return NextResponse.json({ message: 'Post not found' }, { status: 404 });
  }
  // Check author's commentsEnabled preference
  const prefs = await userPreferenceRepository.findByUserId(post.authorId);
  if (!prefs || prefs.commentsEnabled === false) {
    return NextResponse.json({ message: 'Comments are disabled for this user.' }, { status: 403 });
  }
  const comment = await commentRepository.create({
    content,
    author: { connect: { id: session.user.id } },
    post: { connect: { slug } },
  }, {
    include: {
      author: { select: { id: true, name: true, username: true, avatar: true } },
      replies: true,
    },
  });

  // Log the activity
  await logUserActivity({
    userId: session.user.id,
    action: 'comment_created',
    ip: req.headers.get('x-forwarded-for') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    metadata: {
      commentId: comment.id,
      postSlug: slug,
      commentContent: content.substring(0, 100), // First 100 chars for context
    },
  });

  return NextResponse.json(comment, { status: 201, headers });
} 