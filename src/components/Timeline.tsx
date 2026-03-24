"use client"

import React, { useEffect, useState } from "react"
import type { Post as PostType } from "@/components/theme/contentTypes"

interface TimelinePost extends PostType {
  weatherLocation?: string
}

function normalizeMetadata(
  raw: unknown
): PostType["metadata"] {
  if (!Array.isArray(raw)) {
    return (raw as PostType["metadata"]) ?? {}
  }
  return (raw as { key: string; value: unknown; type: string }[]).reduce(
    (acc, m) => {
      acc[m.key] = { value: m.value as never, type: m.type }
      return acc
    },
    {} as PostType["metadata"]
  )
}

export default function Timeline() {
  const [posts, setPosts] = useState<TimelinePost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      try {
        const res = await fetch("/api/posts/all")
        const data = await res.json()
        const postsArray = (data.posts || []) as TimelinePost[]
        const postsWithLocation = postsArray.map((post) => {
          const meta = normalizeMetadata(post.metadata)
          let weatherLocation: string | undefined
          if (meta?.location?.value) {
            weatherLocation = String(meta.location.value)
          } else if (
            meta?.weather?.value &&
            typeof meta.weather.value === "string"
          ) {
            const match = meta.weather.value.match(/in (.+?)( with|\.|$)/)
            weatherLocation = match ? match[1].trim() : undefined
          }
          return {
            ...post,
            metadata: meta,
            author: post.author ?? {
              name: "Author",
              email: undefined,
              avatar: null,
              id: "",
              username: "",
            },
            content: post.content ?? [],
            weatherLocation,
          }
        })
        postsWithLocation.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setPosts(postsWithLocation)
      } catch {
        setPosts([])
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  if (loading) {
    return (
      <p className="text-sm text-[var(--minimal-muted)] font-serif">
        Loading timeline…
      </p>
    )
  }
  if (!posts.length) {
    return (
      <p className="text-sm text-[var(--minimal-muted)] font-serif">
        No posts found.
      </p>
    )
  }

  const postsByYear = posts.reduce<Record<string, TimelinePost[]>>((acc, post) => {
    const year = new Date(post.createdAt).getFullYear().toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    return acc
  }, {})
  const years = Object.keys(postsByYear).sort().reverse()

  return (
    <div className="relative flex flex-col items-center min-h-[50vh]">
      <h2 className="text-2xl font-heading font-medium text-center mb-10 tracking-tight">
        Timeline
      </h2>
      <div className="w-full max-w-2xl relative">
        <div
          className="absolute left-1/2 top-0 h-full w-px bg-[var(--minimal-border)] z-0"
          style={{ transform: "translateX(-50%)" }}
        />
        {years.map((year, i) => {
          const isLeft = i % 2 === 0
          return (
            <div key={year} className="relative flex mb-14">
              {isLeft ? null : <div className="flex-1" />}
              <div
                className={`flex-1 flex flex-col ${isLeft ? "items-end pr-6" : "items-start pl-6"}`}
              >
                <div
                  className={`mb-6 text-sm uppercase tracking-widest text-[var(--minimal-muted)] font-sans ${isLeft ? "text-right" : "text-left"}`}
                >
                  {year}
                  <span className="ml-2 text-stone-400 font-normal normal-case">
                    ({postsByYear[year].length})
                  </span>
                </div>
                <ul className="space-y-6 w-full max-w-sm">
                  {postsByYear[year].map((post) => (
                    <li key={post.id} className="relative">
                      <div
                        className={`rounded-sm border border-[var(--minimal-border)] bg-white/80 px-4 py-3 ${isLeft ? "text-right ml-auto" : "text-left mr-auto"}`}
                      >
                        <div className="font-heading font-medium text-[var(--minimal-fg)]">
                          <a
                            href={`/posts/${post.slug}`}
                            className="no-underline hover:underline underline-offset-4"
                          >
                            {post.title}
                          </a>
                        </div>
                        <div className="text-xs text-[var(--minimal-muted)] mt-1 font-sans">
                          {new Date(post.createdAt).toLocaleDateString()}
                          {post.weatherLocation && (
                            <span className="block mt-0.5">
                              {post.weatherLocation}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`absolute top-4 ${isLeft ? "-right-[1.35rem]" : "-left-[1.35rem]"} w-2.5 h-2.5 rounded-full bg-[var(--minimal-fg)] z-10 ring-4 ring-[var(--minimal-bg)]`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
              {isLeft ? <div className="flex-1" /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
