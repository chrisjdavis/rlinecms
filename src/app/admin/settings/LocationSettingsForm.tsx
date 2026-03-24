'use client'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const locationFormSchema = z.object({
  location: z.string().optional(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
})

type LocationFormData = z.infer<typeof locationFormSchema>

interface LocationSettingsFormProps {
  settings: {
    id: string
    location: string | null
    latitude: number | null
    longitude: number | null
  }
}

export function LocationSettingsForm({ settings }: LocationSettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      location: settings.location || '',
      latitude: settings.latitude,
      longitude: settings.longitude,
    },
  })

  async function onSubmit(data: LocationFormData) {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings')
      }
      toast.success('Location settings updated')
      router.refresh()
    } catch (error: Error | unknown) {
      console.error('Location settings submission error:', error)
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
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Name</FormLabel>
              <FormControl>
                <Input placeholder="San Francisco, CA" {...field} />
              </FormControl>
              <FormDescription>
                The display name for your location
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="37.7749" 
                    type="number" 
                    step="any" 
                    value={value ?? ""} 
                    onChange={e => {
                      const val = e.target.value
                      onChange(val ? parseFloat(val) : null)
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="-122.4194" 
                    type="number" 
                    step="any"
                    value={value ?? ""} 
                    onChange={e => {
                      const val = e.target.value
                      onChange(val ? parseFloat(val) : null)
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  )
} 