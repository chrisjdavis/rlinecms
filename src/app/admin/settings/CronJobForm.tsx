'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import type { CreateCronJobData, UpdateCronJobData } from '@/types/cron'
import { CRON_FREQUENCIES, CronFrequencyValue } from '@/lib/constants/cronFrequencies'

// API response type with string dates (JSON serialized)
type CronJob = {
  id: string
  name: string
  description?: string
  url: string
  frequency: string
  cronExpression: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  easycronJobId?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  user?: {
    id: string
    name?: string
    email: string
  }
}

interface CronJobFormProps {
  job?: CronJob | null
  onSave: (data: CreateCronJobData | UpdateCronJobData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function CronJobForm({ job, onSave, onCancel, isLoading = false }: CronJobFormProps) {
  const [name, setName] = useState(job?.name || '')
  const [description, setDescription] = useState(job?.description || '')
  const [url, setUrl] = useState(job?.url || '')
  const [frequency, setFrequency] = useState<CronFrequencyValue>((job?.frequency as CronFrequencyValue) || 'every-5-minutes')
  const [customExpression, setCustomExpression] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!job

  useEffect(() => {
    if (job) {
      setName(job.name || '')
      setDescription(job.description || '')
      setUrl(job.url || '')
      setFrequency((job.frequency as CronFrequencyValue) || 'every-5-minutes')
      if (job.frequency === 'custom') {
        setCustomExpression(job.cronExpression || '')
      }
    } else {
      // Reset form when job is null (create mode)
      setName('')
      setDescription('')
      setUrl('')
      setFrequency('every-5-minutes')
      setCustomExpression('')
    }
  }, [job])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!url.trim()) {
      newErrors.url = 'URL is required'
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      newErrors.url = 'URL must start with http:// or https://'
    }

    if (frequency === 'custom' && !customExpression.trim()) {
      newErrors.customExpression = 'Custom cron expression is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const formData = {
      name: name.trim(),
      description: description.trim() || undefined,
      url: url.trim(),
      frequency,
      ...(frequency === 'custom' && { customExpression: customExpression.trim() })
    }

    onSave(formData)
  }

  const getNextRunPreview = () => {
    if (frequency === 'custom' && !customExpression.trim()) {
      return 'Enter a valid cron expression'
    }

    try {
      // This is a simplified preview - in a real app you'd use a cron parser
      const now = new Date()
      const nextRun = new Date(now)

      switch (frequency) {
        case 'every-minute':
          nextRun.setMinutes(now.getMinutes() + 1)
          break
        case 'every-5-minutes':
          nextRun.setMinutes(Math.ceil(now.getMinutes() / 5) * 5)
          break
        case 'every-10-minutes':
          nextRun.setMinutes(Math.ceil(now.getMinutes() / 10) * 10)
          break
        case 'every-15-minutes':
          nextRun.setMinutes(Math.ceil(now.getMinutes() / 15) * 15)
          break
        case 'every-30-minutes':
          nextRun.setMinutes(Math.ceil(now.getMinutes() / 30) * 30)
          break
        case 'every-hour':
          nextRun.setHours(now.getHours() + 1, 0, 0, 0)
          break
        case 'every-2-hours':
          nextRun.setHours(Math.ceil(now.getHours() / 2) * 2, 0, 0, 0)
          break
        case 'every-6-hours':
          nextRun.setHours(Math.ceil(now.getHours() / 6) * 6, 0, 0, 0)
          break
        case 'every-12-hours':
          nextRun.setHours(Math.ceil(now.getHours() / 12) * 12, 0, 0, 0)
          break
        case 'daily-midnight':
          nextRun.setDate(now.getDate() + 1)
          nextRun.setHours(0, 0, 0, 0)
          break
        case 'daily-2am':
          nextRun.setDate(now.getDate() + 1)
          nextRun.setHours(2, 0, 0, 0)
          break
        case 'daily-6am':
          nextRun.setDate(now.getDate() + 1)
          nextRun.setHours(6, 0, 0, 0)
          break
        case 'weekly-sunday':
          const daysUntilSunday = (7 - now.getDay()) % 7
          nextRun.setDate(now.getDate() + daysUntilSunday)
          nextRun.setHours(0, 0, 0, 0)
          break
        case 'weekly-monday':
          const daysUntilMonday = (8 - now.getDay()) % 7
          nextRun.setDate(now.getDate() + daysUntilMonday)
          nextRun.setHours(0, 0, 0, 0)
          break
        case 'monthly-1st':
          nextRun.setDate(1)
          nextRun.setMonth(now.getMonth() + 1)
          nextRun.setHours(0, 0, 0, 0)
          break
        case 'custom':
          return 'Custom schedule'
        default:
          return 'Unknown schedule'
      }

      return nextRun.toLocaleString()
    } catch {
      return 'Invalid schedule'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Cron Job' : 'Create New Cron Job'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update the cron job configuration.' : 'Configure a new automated task.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Publish Scheduled Posts"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of what this job does"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-domain.com/api/endpoint"
              className={errors.url ? 'border-red-500' : ''}
            />
            {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
            <p className="text-sm text-muted-foreground">
              The endpoint that will be called when this job runs
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select value={frequency} onValueChange={(value: CronFrequencyValue) => setFrequency(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRON_FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {frequency === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customExpression">Custom Cron Expression *</Label>
              <Input
                id="customExpression"
                value={customExpression}
                onChange={(e) => setCustomExpression(e.target.value)}
                placeholder="e.g., 0 0 * * * (daily at midnight)"
                className={errors.customExpression ? 'border-red-500' : ''}
              />
              {errors.customExpression && (
                <p className="text-sm text-red-500">{errors.customExpression}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Use standard cron syntax: minute hour day month day-of-week
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Next Run Preview</Label>
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {getNextRunPreview()}
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Job' : 'Create Job'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 