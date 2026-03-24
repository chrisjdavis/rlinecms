'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const siteFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

type SiteFormData = z.infer<typeof siteFormSchema>

interface SiteSettingsFormProps {
  settings: {
    id: string
    title: string
    description: string | null
  }
}

export function SiteSettingsForm({ settings }: SiteSettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      title: settings.title,
      description: settings.description || '',
    },
  })

  async function onSubmit(data: SiteFormData) {
    try {
      setLoading(true)
      // Update site settings (title, description)
      const settingsRes = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: data.title, description: data.description }),
      })
      const settingsResult = await settingsRes.json()
      if (!settingsRes.ok) {
        throw new Error(settingsResult.error || 'Failed to update settings')
      }
      toast.success('Settings updated')
      router.refresh()
    } catch (error: Error | unknown) {
      console.error('Settings submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site Title</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Site" {...field} />
              </FormControl>
              <FormDescription>
                This is the name of your site that will be displayed in the browser tab and SEO.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site Description</FormLabel>
              <FormControl>
                <Input placeholder="A brief description of your site" {...field} />
              </FormControl>
              <FormDescription>
                This will be used for SEO and social sharing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  )
} 