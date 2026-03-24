'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Clock, Settings } from 'lucide-react'
import { DataTable } from "@/components/ui/data-table"
import { columns, type CronJob } from "./columns"
import { CronJobForm } from '../settings/CronJobForm'
import { toast } from 'sonner'
import type { CreateCronJobData, UpdateCronJobData } from '@/types/cron'

export default function CronJobsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [editingJob, setEditingJob] = useState<CronJob | null>(null)

  useEffect(() => {
    fetchCronJobs()
  }, [])

  const fetchCronJobs = async () => {
    try {
      const response = await fetch('/api/admin/automations/cronjobs')
      if (response.ok) {
        const data = await response.json()
        setCronJobs(data)
      }
    } catch (error) {
      console.error('Error fetching cron jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCronJob = async (data: CreateCronJobData | UpdateCronJobData) => {
    try {
      const url = editingJob 
        ? `/api/admin/automations/cronjobs/${editingJob.id}`
        : '/api/admin/automations/cronjobs'
      
      const response = await fetch(url, {
        method: editingJob ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        await fetchCronJobs()
        
        if (editingJob) {
          // Update the editing job with the result
          setEditingJob(result)
          toast.success('Cron job updated successfully')
        } else {
          setEditingJob(null)
          router.push('/admin/cron-jobs')
          toast.success('Cron job created successfully')
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save cron job')
      }
    } catch (error) {
      console.error('Error saving cron job:', error)
      toast.error('Failed to save cron job')
    }
  }

  const handleCancelCronJob = () => {
    setEditingJob(null)
    router.push('/admin/cron-jobs')
  }



  const isCreating = searchParams?.get('action') === 'new'
  const isEditing = searchParams?.get('action') === 'edit'
  const editingJobId = searchParams?.get('id')

  // Clear editing job when switching to create mode
  useEffect(() => {
    if (isCreating) {
      setEditingJob(null)
    }
  }, [isCreating])

  // Fetch the job to edit when editing
  useEffect(() => {
    if (isEditing && editingJobId && !editingJob) {
      const job = cronJobs.find(j => j.id === editingJobId)
      if (job) {
        setEditingJob(job)
      }
    }
  }, [isEditing, editingJobId, cronJobs, editingJob])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading cron jobs...</div>
        </div>
      </div>
    )
  }

  if (isCreating || isEditing) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/cron-jobs')}
            className="mb-4"
          >
            ← Back to Cron Jobs
          </Button>
        </div>
        <CronJobForm 
          job={editingJob}
          onSave={handleSaveCronJob}
          onCancel={handleCancelCronJob}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cron Jobs</h1>
          <p className="text-muted-foreground mt-2">
            Manage automated tasks and their execution schedules
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Manage Jobs
          </Button>
          <Button onClick={() => router.push('/admin/cron-jobs?action=new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Button>
        </div>
      </div>



      <div className="grid gap-4 grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cronJobs.length}</div>
            <p className="text-xs text-muted-foreground">
              {cronJobs.filter(job => job.enabled).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Executions</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cronJobs.filter(job => job.lastRun && new Date(job.lastRun) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              in the last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-muted-foreground">
              based on recent executions
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={cronJobs}
        loading={loading}
        searchKey="name"
      />
    </div>
  )
} 