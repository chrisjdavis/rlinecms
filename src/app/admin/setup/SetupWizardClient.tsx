'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { heading, typography, section } from '@/components/theme/admin'
import { cn } from '@/lib/utils'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(1, 'Site title is required').max(200),
  description: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

const STEPS = [
  { id: 1, label: 'Site details' },
  { id: 2, label: 'Next steps' },
] as const

export function SetupWizardClient() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  })

  async function onSubmit(values: FormValues) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title.trim(),
          description: values.description?.trim() || null,
        }),
      })
      const raw = await res.text()
      if (!res.ok) {
        let message = 'Could not save settings'
        try {
          const data = JSON.parse(raw) as { error?: string }
          if (typeof data?.error === 'string') message = data.error
        } catch {
          if (raw) message = raw.slice(0, 200)
        }
        throw new Error(message)
      }
      toast.success('Site settings saved')
      setStep(2)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn(section({ spacing: 'lg' }), 'mx-auto max-w-lg')}>
      <div className="mb-8">
        <p className={cn(typography({ size: 'sm' }), 'text-muted-foreground mb-3')}>
          Step {step} of {STEPS.length}
        </p>
        <div className="flex gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                s.id <= step ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className={heading({ level: 'h3' })}>Welcome to your site</CardTitle>
            <CardDescription>
              There is no site configuration in the database yet. Set a public title and description;
              you can change these anytime in Settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site title</FormLabel>
                      <FormControl>
                        <Input placeholder="My site" autoComplete="organization" {...field} />
                      </FormControl>
                      <FormDescription>Shown in the browser tab, feeds, and theme header.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short description</FormLabel>
                      <FormControl>
                        <Input placeholder="A few words about this site" {...field} />
                      </FormControl>
                      <FormDescription>Optional. Used for SEO and social previews.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className={cn(heading({ level: 'h3' }), 'flex items-center gap-2')}>
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              You are ready to build
            </CardTitle>
            <CardDescription>
              Your site has a name and basic metadata. Here are sensible next steps:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className={cn(typography({ size: 'sm' }), 'list-disc space-y-2 pl-5 text-muted-foreground')}>
              <li>
                Set <strong className="text-foreground">NEXT_PUBLIC_BASE_URL</strong> in your environment to
                your production URL so links and metadata are correct.
              </li>
              <li>
                Review <strong className="text-foreground">Minimal theme</strong> and optional extensions under
                Settings.
              </li>
              <li>Publish a post or page when you are ready for visitors to see content.</li>
            </ul>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/admin">Open dashboard</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/">View public site</Link>
              </Button>
            </div>
            <p className={cn(typography({ size: 'xs' }), 'text-muted-foreground')}>
              Full controls live in{' '}
              <Link href="/admin/settings" className="text-primary underline underline-offset-2">
                Settings
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
