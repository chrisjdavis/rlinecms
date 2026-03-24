'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { Loader2, MoreHorizontal, Play, Edit, Trash2, History, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { CronJob } from '@/types/cron'
import { getFrequencyLabel } from '@/lib/constants/cronFrequencies'

interface CronJobsTableProps {
  cronJobs: CronJob[]
  onEdit: (job: CronJob) => void
  onViewHistory: (jobId: string) => void
}

export function CronJobsTable({ cronJobs, onEdit, onViewHistory }: CronJobsTableProps) {
  const [testingJob, setTestingJob] = useState<string | null>(null)

  const handleTestJob = async (jobId: string) => {
    setTestingJob(jobId)
    try {
      const response = await fetch(`/api/admin/automations/cronjobs/${jobId}/test`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Cron job test executed successfully')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to test cron job')
      }
    } catch (error) {
      toast.error('Failed to test cron job')
      console.error('Error testing cron job:', error)
    } finally {
      setTestingJob(null)
    }
  }

  const getStatusBadge = (job: CronJob) => {
    if (!job.enabled) {
      return <Badge variant="secondary">Disabled</Badge>
    }
    
    if (job.lastRun) {
      const lastRun = new Date(job.lastRun)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - lastRun.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 5) {
        return <Badge variant="default">Recent</Badge>
      } else if (diffInMinutes < 60) {
        return <Badge variant="outline">Recent</Badge>
      } else {
        return <Badge variant="secondary">Stale</Badge>
      }
    }
    
    return <Badge variant="outline">Never Run</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cron Jobs</CardTitle>
        <CardDescription>
          Manage automated tasks and their execution schedules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cronJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No cron jobs configured yet.</p>
            <p className="text-sm">Create your first automated task to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{job.name}</div>
                      {job.description && (
                        <div className="text-sm text-muted-foreground">{job.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getFrequencyLabel(job.frequency)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(job)}</TableCell>
                  <TableCell>
                    {job.lastRun ? (
                      <div className="text-sm">
                        <div>{format(new Date(job.lastRun), 'MMM d, yyyy')}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(job.lastRun), 'h:mm a')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.nextRun ? (
                      <div className="text-sm">
                        <div>{format(new Date(job.nextRun), 'MMM d, yyyy')}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(job.nextRun), 'h:mm a')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not scheduled</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleTestJob(job.id)}
                          disabled={testingJob === job.id}
                        >
                          {testingJob === job.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          Test Job
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(job)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewHistory(job.id)}>
                          <History className="mr-2 h-4 w-4" />
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {}}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>


    </Card>
  )
} 