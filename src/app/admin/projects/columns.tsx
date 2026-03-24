"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Image from "next/image"

export type Project = {
  id: string
  title: string
  url: string | null
  shortDescription: string
  carouselOrder: number
  heroImage: string | null
  icon: string | null
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED"
  createdAt: string
  updatedAt: string
}

function ProjectActions({ project }: { project: Project }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete project")
      }

      toast.success("Project deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("Error deleting project:", error)
      toast.error("Failed to delete project")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/admin/projects/${project.id}`)}
      >
        Edit
      </Button>
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

export const columns: ColumnDef<Project, unknown>[] = [
  {
    id: "heroImage",
    accessorFn: (row) => row.heroImage,
    header: "Image",
    cell: ({ row }) => {
      const image = row.getValue("heroImage") as string | null
      return image ? (
        <div className="relative h-10 w-16 overflow-hidden rounded border">
          <Image
            src={image}
            alt=""
            fill
            className="object-cover"
            unoptimized={image.startsWith("http")}
          />
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    id: "title",
    accessorFn: (row) => row.title,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="max-w-md truncate font-medium">{row.getValue("title")}</div>
    ),
  },
  {
    id: "url",
    accessorFn: (row) => row.url,
    header: "URL",
    cell: ({ row }) => {
      const url = row.getValue("url") as string | null
      return url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="max-w-[200px] truncate text-blue-600 hover:underline"
        >
          {url}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    id: "carouselOrder",
    accessorFn: (row) => row.carouselOrder,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Order
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "status",
    accessorFn: (row) => row.status,
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "PUBLISHED" ? "default" : "secondary"}>
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const project = row.original
      return <ProjectActions project={project} />
    },
  },
]
