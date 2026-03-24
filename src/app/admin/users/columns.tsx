"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export type User = {
  id: string
  name?: string | null
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

function UserActions({ user }: { user: User }) {
  const router = useRouter()

  async function handleDelete() {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete user")
      }
      toast.success("User deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/admin/users/${user.id}`)}
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

export const columns: ColumnDef<User, unknown>[] = [
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "email",
    accessorFn: (row) => row.email,
    header: "Email",
  },
  {
    id: "role",
    accessorFn: (row) => row.role,
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return <Badge variant={role === "ADMIN" ? "default" : "secondary"}>{role}</Badge>
    },
  },
  {
    id: "createdAt",
    accessorFn: (row) => row.createdAt,
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <div>{format(date, "PPP")}</div>
    },
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
    cell: ({ row }) => {
      const user = row.original
      return <UserActions user={user} />
    },
  },
] 