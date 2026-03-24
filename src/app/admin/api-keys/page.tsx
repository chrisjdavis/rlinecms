"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { columns, type ApiKey } from "./columns"
import { ApiKeyDialog } from "./_components/api-key-dialog"

interface ApiKeysResponse {
  apiKeys: ApiKey[]
  total: number
}

export default function ApiKeysPage() {
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  useEffect(() => {
    fetchApiKeys()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize])

  async function fetchApiKeys() {
    try {
      setLoading(true)
      const offset = pagination.pageIndex * pagination.pageSize
      const response = await fetch(`/api/admin/api-keys?limit=${pagination.pageSize}&offset=${offset}`)
      const data: ApiKeysResponse = await response.json()
      setApiKeys(data.apiKeys)
      setTotal(data.total)
    } catch (error) {
      console.error("Error fetching API keys:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaginationChange = (newPagination: { pageIndex: number; pageSize: number }) => {
    setPagination(newPagination)
  }

  const handleSuccess = () => {
    setIsDialogOpen(false)
    fetchApiKeys()
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">API Keys</h3>
          <p className="text-sm text-muted-foreground">
            Manage API keys for authenticated API access. Showing {apiKeys.length} of {total} keys.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New API Key
        </Button>
      </div>

      <div className="rounded-lg border p-4 bg-muted/50">
        <h4 className="text-sm font-medium mb-2">Using keys</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Extensions you add under <code className="text-xs bg-background px-1 rounded">src/modules</code> can expose
          routes listed in <code className="text-xs bg-background px-1 rounded">publicApiPaths</code> in each
          extension&apos;s <code className="text-xs bg-background px-1 rounded">module.json</code>. Use an API key on
          those routes as documented by the extension.
        </p>
        <p className="text-xs text-muted-foreground">
          Include the key in the request:{" "}
          <code className="bg-background px-2 py-0.5 rounded">X-API-Key: your-key</code> or{" "}
          <code className="bg-background px-2 py-0.5 rounded">Authorization: Bearer your-key</code>
        </p>
      </div>

      <DataTable
        columns={columns}
        data={apiKeys}
        loading={loading}
        searchKey="name"
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        pageCount={Math.ceil(total / pagination.pageSize)}
        manualPagination={true}
      />

      <ApiKeyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
