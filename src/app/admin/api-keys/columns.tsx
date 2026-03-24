"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Copy, Eye, EyeOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

export type ApiKey = {
  id: string
  name: string
  key: string
  isActive: boolean
  lastUsedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

function ApiKeyDisplay({ apiKey }: { apiKey: string }) {
  const [showKey, setShowKey] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    toast.success("API key copied to clipboard")
  }

  return (
    <div className="flex items-center gap-2">
      <code className="text-xs bg-muted px-2 py-1 rounded">
        {showKey ? apiKey : "•".repeat(32)}
      </code>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowKey(!showKey)}
      >
        {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  )
}

function ApiKeyActions({ apiKey }: { apiKey: ApiKey }) {
  const router = useRouter()
  const [isToggling, setIsToggling] = useState(false)

  async function handleToggleActive() {
    try {
      setIsToggling(true)
      const response = await fetch(`/api/admin/api-keys/${apiKey.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !apiKey.isActive }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle API key status")
      }

      toast.success(apiKey.isActive ? "API key deactivated" : "API key activated")
      router.refresh()
    } catch (error) {
      console.error("Error toggling API key:", error)
      toast.error("Failed to toggle API key status")
    } finally {
      setIsToggling(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${apiKey.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete API key")
      }

      toast.success("API key deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("Error deleting API key:", error)
      toast.error("Failed to delete API key")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleActive}
        disabled={isToggling}
      >
        {apiKey.isActive ? "Deactivate" : "Activate"}
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

export const columns: ColumnDef<ApiKey, unknown>[] = [
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      return <div className="font-medium">{name}</div>
    },
  },
  {
    id: "key",
    accessorFn: (row) => row.key,
    header: "API Key",
    cell: ({ row }) => {
      const key = row.getValue("key") as string
      return <ApiKeyDisplay apiKey={key} />
    },
  },
  {
    id: "isActive",
    accessorFn: (row) => row.isActive,
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean
      const expiresAt = row.original.expiresAt
      const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false
      
      if (isExpired) {
        return <Badge variant="secondary">Expired</Badge>
      }
      
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    id: "lastUsedAt",
    accessorFn: (row) => row.lastUsedAt,
    header: "Last Used",
    cell: ({ row }) => {
      const lastUsedAt = row.getValue("lastUsedAt") as string | undefined
      if (!lastUsedAt) {
        return <span className="text-muted-foreground">Never</span>
      }
      const date = new Date(lastUsedAt)
      return <div>{format(date, "PPp")}</div>
    },
  },
  {
    id: "expiresAt",
    accessorFn: (row) => row.expiresAt,
    header: "Expires",
    cell: ({ row }) => {
      const expiresAt = row.getValue("expiresAt") as string | undefined
      if (!expiresAt) {
        return <span className="text-muted-foreground">Never</span>
      }
      const date = new Date(expiresAt)
      const isExpired = date < new Date()
      return (
        <div className={isExpired ? "text-red-600" : ""}>
          {format(date, "PPP")}
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
    id: "actions",
    cell: ({ row }) => {
      const apiKey = row.original
      return <ApiKeyActions apiKey={apiKey} />
    },
  },
]
