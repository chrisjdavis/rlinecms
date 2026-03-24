"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { columns, type Project } from "./columns"

interface ProjectsResponse {
  projects: Project[]
  total: number
}

interface PaginationState {
  pageIndex: number
  pageSize: number
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Stable internal pagination state with defaults
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const offset = pagination.pageIndex * pagination.pageSize
        const response = await fetch(
          `/api/admin/projects?limit=${pagination.pageSize}&offset=${offset}`
        )
        const data: ProjectsResponse = await response.json()
        if (!response.ok) {
          setProjects([])
          setTotal(0)
          return
        }
        setProjects(Array.isArray(data.projects) ? data.projects : [])
        setTotal(typeof data.total === 'number' ? data.total : 0)
      } catch (error) {
        console.error("Error fetching projects:", error)
        setProjects([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [pagination.pageIndex, pagination.pageSize])

  const paginatedProjects = useMemo(() => projects, [projects])
  const pageCount = useMemo(
    () => Math.ceil(total / pagination.pageSize),
    [total, pagination.pageSize]
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">Projects</h3>
          <p className="text-sm text-muted-foreground">
            Manage projects shown in the homepage carousel. Showing {projects.length}{" "}
            of {total} projects.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/projects/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={paginatedProjects}
        loading={loading}
        searchKey="title"
        pagination={{ pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }}
        onPaginationChange={(newPagination) => setPagination(newPagination)}
        pageCount={pageCount}
        manualPagination={true}
      />
    </div>
  )
}

ProjectsPage.displayName = "ProjectsPage"