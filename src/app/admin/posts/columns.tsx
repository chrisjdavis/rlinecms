"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export type Post = {
  id: string
  title: string
  slug: string
  status: "draft" | "published" | "scheduled"
  scheduledAt?: string
  createdAt: string
  updatedAt: string
  excerpt?: string
  author?: {
    name: string
    email: string
  }
}

function PostActions({ post }: { post: Post }) {
  const router = useRouter()

  async function handleDelete() {
    try {
      const response = await fetch(`/api/posts/${post.slug}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete post")
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("post-deleted", {
            detail: { postId: post.id },
          })
        )
      }

      toast.success("Post deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("Error deleting post:", error)
      toast.error("Failed to delete post")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/admin/posts/${post.slug}`)}
      >
        Edit
      </Button>
      <button
        onClick={() => window.open(`/preview/${post.slug}`, '_blank')}
        className="text-sm px-3 py-1.5 hover:bg-accent rounded-md"
      >
        Preview
      </button>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700"
        onClick={handleDelete}
      >
        Delete
      </Button>
    </div>
  )
}

export const columns: ColumnDef<Post, unknown>[] = [
  {
    id: "title",
    accessorFn: (row) => row.title,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    id: "status",
    accessorFn: (row) => row.status,
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const scheduledAt = row.original.scheduledAt
      
      let variant: "default" | "secondary" | "outline" = "secondary"
      let displayText = status
      
      if (status === "published") {
        variant = "default"
      } else if (status === "scheduled") {
        variant = "outline"
        displayText = "Scheduled"
      }
      
      return (
        <div className="flex flex-col gap-1">
          <Badge variant={variant}>
            {displayText}
          </Badge>
          {status === "scheduled" && scheduledAt && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(scheduledAt), "MMM d, yyyy 'at' h:mm a")}
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: "createdAt",
    accessorFn: (row) => row.createdAt,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <div>{format(date, "PPP")}</div>
    },
  },
  {
    id: "updatedAt",
    accessorFn: (row) => row.updatedAt,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = row.getValue("updatedAt");
      const date =
        typeof value === "string" || typeof value === "number"
          ? new Date(value)
          : null;
      return (
        <div>
          {date && !isNaN(date.getTime()) ? format(date, "PPP") : "—"}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const post = row.original
      return <PostActions post={post} />
    },
  },
] 