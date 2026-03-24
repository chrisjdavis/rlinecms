"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { PageForm } from "../_components/page-form"
import { Block } from "@/components/block-editor"
import { toast } from "sonner"

interface PageState {
  id: string
  title: string
  slug: string
  content: Record<string, Block>
  status: "DRAFT" | "PUBLISHED"
}

export default function PageEditor() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [page, setPage] = useState<PageState | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPage = useCallback(async () => {
    if (!params?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/pages/${params.id}`)
      if (!res.ok) throw new Error("Failed to fetch page")
      const data = await res.json()
      // Map blocks to content object
      const content = (data.blocks || []).reduce((acc: Record<string, Block>, block: Block) => {
        acc[block.id] = {
          id: block.id,
          type: block.type,
          content: block.content,
          order: block.order
        }
        return acc
      }, {} as Record<string, Block>)
      setPage({
        id: data.id,
        title: data.title,
        slug: data.slug,
        content,
        status: data.status || "DRAFT"
      })
    } catch {
      toast.error("Failed to load page")
      router.push("/admin/pages")
    } finally {
      setLoading(false)
    }
  }, [params?.id, router])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  if (loading) {
    return <div className="container mx-auto py-10">Loading...</div>
  }
  if (!page) {
    return null
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Page</h1>
        <p className="text-muted-foreground">
          Make changes to your page here. Click save when you&apos;re done.
        </p>
      </div>
      <PageForm page={page} />
    </div>
  )
} 