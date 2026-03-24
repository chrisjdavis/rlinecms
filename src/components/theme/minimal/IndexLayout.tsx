'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Layout } from './Layout'
import type { Site } from '../contentTypes'
import { useEffect, useState } from 'react'

interface IndexPost {
  id: string
  title: string
  slug: string
  createdAt: string
  excerpt?: string | null
}

interface IndexProps {
  site: Site & { startDate?: string }
  initialPostCount?: number
  navigation?: {
    header: { label: string; url: string }[]
    footer: { label: string; url: string }[]
  }
}

export function IndexLayout({
  site,
  initialPostCount = 12,
  navigation,
}: IndexProps) {
  const [posts, setPosts] = useState<IndexPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/posts?limit=${initialPostCount}&offset=0`)
        if (!res.ok) throw new Error('Failed to fetch posts')
        const data = await res.json()
        setPosts(data.posts ?? [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [initialPostCount])

  return (
    <Layout site={site} navigation={navigation}>
      <div>
        <h1 className="text-2xl font-heading font-medium tracking-tight mb-2">
          Writing
        </h1>
        <p className="text-sm text-[var(--minimal-muted)] mb-12 font-serif">
          Recent posts
        </p>

        {error && (
          <p className="text-sm text-red-600 mb-6" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <ul className="space-y-0 divide-y divide-[var(--minimal-border)] border-y border-[var(--minimal-border)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="py-6 animate-pulse">
                <div className="h-3 w-24 bg-stone-200 rounded mb-3" />
                <div className="h-5 w-3/4 max-w-md bg-stone-200 rounded" />
              </li>
            ))}
          </ul>
        ) : posts.length === 0 ? (
          <p className="text-[var(--minimal-muted)] font-serif">No posts yet.</p>
        ) : (
          <ul className="space-y-0 divide-y divide-[var(--minimal-border)] border-y border-[var(--minimal-border)]">
            {posts.map((post) => (
              <li key={post.id} className="py-8 first:pt-0 last:pb-0">
                <time
                  dateTime={post.createdAt}
                  className="text-xs uppercase tracking-widest text-[var(--minimal-muted)] font-sans"
                >
                  {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                </time>
                <h2 className="mt-2 text-xl font-heading font-medium leading-snug">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-[var(--minimal-fg)] no-underline hover:underline underline-offset-4"
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && (
                  <p className="mt-3 text-[var(--minimal-muted)] font-serif text-[0.95rem] leading-relaxed max-w-prose">
                    {post.excerpt}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-14 text-sm">
          <Link
            href="/posts/archive"
            className="text-[var(--minimal-muted)] no-underline hover:text-[var(--minimal-fg)] hover:underline underline-offset-4"
          >
            Full archive →
          </Link>
        </p>
      </div>
    </Layout>
  )
}
