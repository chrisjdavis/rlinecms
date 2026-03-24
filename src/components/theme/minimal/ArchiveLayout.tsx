'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Layout } from './Layout'
import type { Site } from '../contentTypes'

interface Author {
  name: string
  email: string
  avatar: string
  id: string
  username: string
}

interface ArchivePost {
  id: string
  title: string
  slug: string
  status: string
  createdAt: string
  updatedAt: string
  excerpt?: string
  author: Author
  metadata?: Record<string, unknown>
}

interface ArchiveLayoutProps {
  site: Site
  navigation?: {
    header: { label: string; url: string }[]
    footer: { label: string; url: string }[]
  }
}

const PAGE_SIZE = 10

export function ArchiveLayout({ site, navigation }: ArchiveLayoutProps) {
  const [posts, setPosts] = useState<ArchivePost[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/posts/all?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`
        )
        if (!res.ok) throw new Error('Failed to fetch posts')
        const data = await res.json()
        setPosts(data.posts)
        setTotal(data.total)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  return (
    <Layout site={site} navigation={navigation}>
      <div>
        <h1 className="text-2xl font-heading font-medium tracking-tight mb-2">
          Archive
        </h1>
        <p className="text-sm text-[var(--minimal-muted)] mb-12 font-serif">
          All published posts
        </p>

        {error && (
          <p className="text-sm text-red-600 mb-6" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <ul className="space-y-0 divide-y divide-[var(--minimal-border)] border-y border-[var(--minimal-border)]">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <li key={i} className="py-6 animate-pulse">
                <div className="h-3 w-28 bg-stone-200 rounded mb-3" />
                <div className="h-5 w-2/3 max-w-lg bg-stone-200 rounded" />
              </li>
            ))}
          </ul>
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
                <h2 className="mt-2 text-lg font-heading font-medium">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-[var(--minimal-fg)] no-underline hover:underline underline-offset-4"
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && (
                  <p className="mt-2 text-sm text-[var(--minimal-muted)] font-serif leading-relaxed max-w-prose">
                    {post.excerpt}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-center gap-6 mt-12 text-sm">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="text-[var(--minimal-muted)] disabled:opacity-40 hover:text-[var(--minimal-fg)]"
          >
            Previous
          </button>
          <span className="text-[var(--minimal-muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="text-[var(--minimal-muted)] disabled:opacity-40 hover:text-[var(--minimal-fg)]"
          >
            Next
          </button>
        </div>
      </div>
    </Layout>
  )
}
