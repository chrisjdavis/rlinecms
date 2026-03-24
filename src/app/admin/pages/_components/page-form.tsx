"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { BlockEditor, Block } from "@/components/block-editor"
import { pageSchema } from "@/lib/validation"

type FormData = z.infer<typeof pageSchema>

interface PageFormProps {
  page?: {
    id: string
    title: string
    slug: string
    content: Record<string, Block>
    status: "DRAFT" | "PUBLISHED"
  }
}

export function PageForm({ page }: PageFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: page?.title || "",
      slug: page?.slug || "",
      content: page?.content || {},
      status: page?.status || "DRAFT",
    },
  })

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true)
      const response = await fetch(page ? `/api/pages/${page.id}` : "/api/pages", {
        method: page ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Something went wrong")
      }

      const result = await response.json()
      // Revalidate the page and pages list, and the route path
      const slugToRevalidate = page ? data.slug : result.slug
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: `page-${slugToRevalidate}` }),
      })
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: 'pages' }),
      })
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `/${slugToRevalidate}` }),
      })
      if (page) {
        router.refresh()
        toast.success("Page updated")
      } else {
        router.push(`/admin/pages/${result.id}`)
        toast.success("Page created")
      }
    } catch (error) {
      toast.error("Something went wrong")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-8">
        {/* Main content column */}
        <div className="flex-1 space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block mb-2">Title</FormLabel>
                <FormControl>
                  <Input placeholder="About Us" {...field} />
                </FormControl>
                <FormDescription>
                  The title of your page.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block mb-2">Content</FormLabel>
                <FormControl>
                  <BlockEditor
                    initialContent={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-6">
          <div className="sticky top-6 space-y-6 rounded-lg border p-4">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-2">Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="about-us" {...field} />
                  </FormControl>
                  <FormDescription>
                    The URL-friendly version of the title.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block mb-2">Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set the status of your page.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push("/admin/pages")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Saving..." : page ? "Save changes" : "Create page"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
} 