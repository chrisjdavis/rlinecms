import { format } from 'date-fns'
import Link from 'next/link'
import { Layout } from './Layout'
import type { PostProps } from '../contentTypes'
import { renderBlock, renderContent } from '../renderBlocks'
import Comments from '../Comments'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { calculateReadTime } from '@/lib/readTime'

export function PostLayout({
  post,
  site,
  navigation,
  prevPost,
  nextPost,
}: PostProps & {
  navigation?: {
    header: { label: string; url: string }[]
    footer: { label: string; url: string }[]
  }
  prevPost?: { slug: string; title: string }
  nextPost?: { slug: string; title: string }
}) {
  const readTime = calculateReadTime(
    post.content.map((b) => String(b.content)).join(' ')
  )

  return (
    <Layout site={site} navigation={navigation}>
      <article>
        <header className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {post.author?.id || post.author?.username ? (
              <Link href={`/users/${post.author.username || post.author.id}`}>
                <Avatar className="h-12 w-12">
                  {post.author?.avatar ? (
                    <AvatarImage
                      src={post.author.avatar}
                      alt={post.author.name || post.author.username || 'User'}
                    />
                  ) : (
                    <AvatarFallback>
                      {(
                        post.author?.name?.charAt(0) ||
                        post.author?.username?.charAt(0) ||
                        'U'
                      ).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Link>
            ) : (
              <Avatar className="h-12 w-12">
                {post.author?.avatar ? (
                  <AvatarImage
                    src={post.author.avatar}
                    alt={post.author.name || post.author.username || 'User'}
                  />
                ) : (
                  <AvatarFallback>
                    {(
                      post.author?.name?.charAt(0) ||
                      post.author?.username?.charAt(0) ||
                      'U'
                    ).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl sm:text-4xl font-heading font-medium tracking-tight text-stone-900 leading-tight">
                {post.title}
              </h1>
              {post.metadata?.tagline && (
                <div className="mt-3 text-lg font-serif text-[var(--minimal-muted)] leading-snug">
                  {renderContent(
                    post.metadata.tagline.value,
                    post.metadata.tagline.type
                  )}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-widest text-[var(--minimal-muted)] font-sans">
                <time dateTime={post.createdAt}>
                  {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                </time>
                <span>{readTime} min read</span>
                {post.authorAgeInDays != null && (
                  <span>
                    {(post.authorAgeInDays / 365).toFixed(1)} yrs author age
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-2">
          {post.content.map((block) => (
            <div key={block.id}>{renderBlock(block)}</div>
          ))}
        </div>

        <Comments postSlug={post.slug} authorId={post.author?.id || ''} />

        {(prevPost || nextPost) && (
          <nav className="mt-16 pt-10 border-t border-[var(--minimal-border)] flex flex-col sm:flex-row sm:justify-between gap-8 text-sm">
            {prevPost && (
              <div>
                <span className="block text-xs uppercase tracking-widest text-[var(--minimal-muted)] mb-2">
                  Previous
                </span>
                <Link
                  href={`/posts/${prevPost.slug}`}
                  className="font-heading font-medium text-[var(--minimal-fg)] no-underline hover:underline underline-offset-4"
                >
                  {prevPost.title}
                </Link>
              </div>
            )}
            {nextPost && (
              <div className="sm:text-right">
                <span className="block text-xs uppercase tracking-widest text-[var(--minimal-muted)] mb-2">
                  Next
                </span>
                <Link
                  href={`/posts/${nextPost.slug}`}
                  className="font-heading font-medium text-[var(--minimal-fg)] no-underline hover:underline underline-offset-4"
                >
                  {nextPost.title}
                </Link>
              </div>
            )}
          </nav>
        )}
      </article>
    </Layout>
  )
}
