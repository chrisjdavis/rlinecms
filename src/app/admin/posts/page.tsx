"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { columns, type Post } from "./columns"

interface PostsResponse {
  posts: Post[]
  total: number
}

export default function PostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true)
        const offset = pagination.pageIndex * pagination.pageSize
        const response = await fetch(`/api/admin/posts?limit=${pagination.pageSize}&offset=${offset}`)
        const data: PostsResponse = await response.json()
        setPosts(data.posts)
        setTotal(data.total)
      } catch (error) {
        console.error("Error fetching posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [pagination.pageIndex, pagination.pageSize])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handlePostDeleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ postId: string }>
      const deletedPostId = customEvent.detail?.postId
      if (!deletedPostId) {
        return
      }

      setPosts((previousPosts) => previousPosts.filter((post) => post.id !== deletedPostId))
      setTotal((previousTotal) => Math.max(previousTotal - 1, 0))
    }

    window.addEventListener("post-deleted", handlePostDeleted as EventListener)

    return () => {
      window.removeEventListener("post-deleted", handlePostDeleted as EventListener)
    }
  }, [])

  const handlePaginationChange = (newPagination: { pageIndex: number; pageSize: number }) => {
    setPagination(newPagination)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">Posts</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage your blog posts. Showing {posts.length} of {total} posts.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/posts/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={posts}
        loading={loading}
        searchKey="title"
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        pageCount={Math.ceil(total / pagination.pageSize)}
        manualPagination={true}
      />
    </div>
  )
} 