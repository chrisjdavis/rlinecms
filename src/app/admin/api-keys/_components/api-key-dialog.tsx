"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { toast } from "sonner"
import { Copy } from "lucide-react"

const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  expiresAt: z.string().optional(),
})

type FormData = z.infer<typeof apiKeySchema>

interface ApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ApiKeyDialog({ open, onOpenChange, onSuccess }: ApiKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      expiresAt: "",
    },
  })

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true)
      
      const submitData = {
        ...data,
        ...(data.expiresAt ? { expiresAt: new Date(data.expiresAt).toISOString() } : {}),
      }

      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        throw new Error("Failed to create API key")
      }

      const result = await response.json()
      setCreatedKey(result.key)
      toast.success("API key created successfully")
    } catch (error) {
      toast.error("Failed to create API key")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCreatedKey(null)
    form.reset()
    onOpenChange(false)
    if (createdKey) {
      onSuccess()
    }
  }

  const handleCopy = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      toast.success("API key copied to clipboard")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {createdKey ? "API Key Created" : "Create API Key"}
          </DialogTitle>
          <DialogDescription>
            {createdKey
              ? "Copy your API key now. You won't be able to see it again!"
              : "Create a new API key to access your content via the API."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {createdKey ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm break-all">{createdKey}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Make sure to copy your API key now. You won&apos;t be able to see it again!
              </p>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My App API Key" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this API key.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave empty for a key that never expires.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Creating..." : "Create API Key"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
