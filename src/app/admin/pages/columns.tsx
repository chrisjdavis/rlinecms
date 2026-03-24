"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Status } from "@prisma/client"

export type Page = {
  id: string
  title: string
  slug: string
  status: Status
  author: string
  updatedAt: Date
}

function PageActions({ page }: { page: Page }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete the page '${page.title}'?`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/pages/${page.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete page")
      toast.success("Page deleted successfully")
      router.refresh()
    } catch {
      toast.error("Error deleting page")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/admin/pages/${page.id}`)}
      >
        Edit
      </Button>
      <button
        onClick={() => window.open(`/${page.slug}`, '_blank')}
        className="text-sm px-3 py-1.5 hover:bg-accent rounded-md"
      >
        View
      </button>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  )
}

export const columns: ColumnDef<Page>[] = [
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
      <div className="flex max-w-[500px] items-center">
        <span className="truncate font-medium">{row.getValue("title")}</span>
      </div>
    ),
  },
  {
    id: "status",
    accessorFn: (row) => row.status,
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "PUBLISHED" || status === "published" ? "default" : "secondary"}>
          {status.toLowerCase()}
        </Badge>
      )
    },
  },
  {
    id: "author",
    accessorFn: (row) => row.author,
    header: "Author",
    cell: ({ row }) => <span>{row.getValue("author")}</span>,
  },
  {
    id: "updatedAt",
    accessorFn: (row) => row.updatedAt,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Updated
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"))
      return <div>{format(date, "PPP")}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <PageActions page={row.original} />,
  },
] 