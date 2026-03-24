import { NextResponse } from "next/server";
import { postRepository } from '@/lib/repositories/postRepository';
import { Status } from '@prisma/client';

export async function GET() {
  try {
    // Only published posts by non-deleted users
    const where = { status: Status.PUBLISHED, author: { is: { deletedAt: null } } };
    const [posts, total] = await Promise.all([
      postRepository.findAll({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          excerpt: true,
          author: {
            select: {
              name: true,
              avatar: true,
              id: true,
              username: true
            }
          },
          metadata: true
        }
      }),
      postRepository.count({ where })
    ]);
    return NextResponse.json({ posts, total });
  } catch {
    return NextResponse.json({ error: "Failed to fetch all posts" }, { status: 500 });
  }
} 