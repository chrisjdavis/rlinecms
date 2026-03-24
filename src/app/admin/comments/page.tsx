import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function CommentsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const comments = await prisma.comment.findMany({
    where: {
      authorId: session.user.id,
    },
    include: {
      post: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-semibold tracking-tight">My Comments</h1>
      <div className="mt-6 space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-lg border p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">
                <a
                  href={`/blog/${comment.post.slug}`}
                  className="hover:underline"
                >
                  {comment.post.title}
                </a>
              </h2>
              <span className="text-sm text-muted-foreground">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {comment.content}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-muted-foreground">
            You haven&apos;t made any comments yet.
          </p>
        )}
      </div>
    </div>
  )
} 