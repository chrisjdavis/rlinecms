"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ImageUpload } from "@/components/image-upload"

const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  url: z.union([z.string().url("Must be a valid URL"), z.literal("")]).optional(),
  shortDescription: z.string().min(1, "Short description is required").max(500),
  carouselOrder: z.coerce.number().int().min(0),
  heroImage: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]),
})

type FormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: {
    id: string
    title: string
    url: string | null
    shortDescription: string
    carouselOrder: number
    heroImage: string | null
    icon: string | null
    status: "DRAFT" | "PUBLISHED" | "SCHEDULED"
  }
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title || "",
        url: project?.url ?? "",
      shortDescription: project?.shortDescription || "",
      carouselOrder: project?.carouselOrder ?? 0,
      heroImage: project?.heroImage ?? "",
      icon: project?.icon ?? "",
      status: project?.status || "PUBLISHED",
    },
  })

  // Sync form when project changes (e.g. navigating to edit with fresh data)
  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title,
        url: project.url ?? "",
        shortDescription: project.shortDescription,
        carouselOrder: project.carouselOrder,
        heroImage: project.heroImage ?? "",
        icon: project.icon ?? "",
        status: project.status,
      })
    }
  }, [project?.id, form])

  useEffect(() => {
    async function fetchNextOrder() {
      if (project) return

      try {
        const response = await fetch("/api/admin/projects?limit=1000")
        if (!response.ok) return

        const data = await response.json()
        const projects = data.projects || []

        const maxOrder = projects.reduce(
          (max: number, item: { carouselOrder: number }) => {
            return Math.max(max, item.carouselOrder ?? 0)
          },
          -1
        )

        form.setValue("carouselOrder", maxOrder + 1)
      } catch (error) {
        console.error("Error fetching next order:", error)
      }
    }

    fetchNextOrder()
  }, [project, form])

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true)
      const payload = {
        ...data,
        heroImage: data.heroImage || null,
        icon: data.icon || null,
      }
      const response = await fetch(
        project ? `/api/admin/projects/${project.id}` : "/api/admin/projects",
        {
          method: project ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Something went wrong")
      }

      toast.success(project ? "Project updated" : "Project created")
      router.push("/admin/projects")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      )
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-8">
        <div className="flex-1 space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="My Awesome App" {...field} />
                </FormControl>
                <FormDescription>
                  Display name for the project in the carousel.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://myapp.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional. Link when users click the project image in the carousel.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A brief description of the project..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Shown in the carousel slide (max 500 characters).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="heroImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hero Image</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {field.value ? (
                      <>
                        <div className="relative block w-full max-w-md">
                          <div className="relative w-full aspect-video overflow-hidden rounded-lg border bg-muted">
                            <img
                              src={field.value}
                              alt="Hero preview"
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => field.onChange("")}
                          >
                            Remove
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Upload a different image to replace.
                        </p>
                      </>
                    ) : null}
                    <ImageUpload
                      key={field.value || "empty"}
                      onUpload={(url) => field.onChange(url)}
                      className={field.value ? "max-w-md" : ""}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Upload a photo for the carousel. JPEG, PNG, GIF, WebP (max 5MB).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon (optional)</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {field.value ? (
                      <>
                        <div className="relative inline-block">
                          <div className="relative w-16 h-16 overflow-hidden rounded-lg border bg-muted">
                            <img
                              src={field.value}
                              alt="Icon preview"
                              className="object-contain w-full h-full"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => field.onChange("")}
                          >
                            Remove
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Upload a different icon to replace.
                        </p>
                      </>
                    ) : null}
                    <ImageUpload
                      key={field.value || "empty-icon"}
                      onUpload={(url) => field.onChange(url)}
                      className={field.value ? "max-w-[200px]" : ""}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Optional. Shown to the left of the title in the carousel.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="w-80 space-y-6">
          <div className="sticky top-6 space-y-6 rounded-lg border p-4">
            <FormField
              control={form.control}
              name="carouselOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carousel Order</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Lower numbers appear first in the carousel.
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
                  <FormLabel>Status</FormLabel>
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
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only published projects appear on the homepage.
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
                onClick={() => router.push("/admin/projects")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading
                  ? "Saving..."
                  : project
                    ? "Save changes"
                    : "Create Project"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
