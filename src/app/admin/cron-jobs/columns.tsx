"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import cronstrue from 'cronstrue'
import { useEffect, useState } from "react"
import type { CronJobExecution } from '@/types/cron'
import { ArrowUpDown } from "lucide-react"

// API response type with string dates (JSON serialized)
export type CronJob = {
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
  executions?: CronJobExecution[]
  createdBy: string
  user?: {
    id: string
    name?: string
    email: string
  }
}

function JobActions({ job }: { job: CronJob }) {
  const router = useRouter();
  async function handleDelete() {
    try {
      const response = await fetch(`/api/admin/automations/cronjobs/${job.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete cron job");
      }
      toast.success("Cron job deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting cron job:", error);
      toast.error("Failed to delete cron job");
    }
  }
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/admin/cron-jobs?action=edit&id=${job.id}`)}
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700"
        onClick={handleDelete}
      >
        Delete
      </Button>
    </div>
  );
}

function SuccessCell({ job }: { job: CronJob }) {
  const [successes, setSuccesses] = useState<string | number>("-");
  useEffect(() => {
    let ignore = false;
    async function fetchLogs() {
      if (job.easycronJobId) {
        try {
          const res = await fetch(`/api/admin/automations/cronjobs/${job.easycronJobId}/logs?limit=100`);
          if (!res.ok) return;
          const data = await res.json();
          const logs: CronJobExecution[] = data.execution_logs || [];
          if (!ignore) {
            setSuccesses(logs.filter((l: CronJobExecution) => l.status === 'SUCCESS').length);
          }
        } catch {
          if (!ignore) {
            setSuccesses("-");
          }
        }
      } else if (job.executions) {
        setSuccesses(job.executions.filter((l: CronJobExecution) => l.status === 'SUCCESS').length);
      }
    }
    fetchLogs();
    return () => { ignore = true; };
  }, [job]);
  return <span>{successes}</span>;
}

function FailureCell({ job }: { job: CronJob }) {
  const [failures, setFailures] = useState<string | number>("-");
  useEffect(() => {
    let ignore = false;
    async function fetchLogs() {
      if (job.easycronJobId) {
        try {
          const res = await fetch(`/api/admin/automations/cronjobs/${job.easycronJobId}/logs?limit=100`);
          if (!res.ok) return;
          const data = await res.json();
          const logs: CronJobExecution[] = data.execution_logs || [];
          if (!ignore) {
            setFailures(logs.filter((l: CronJobExecution) => l.status === 'FAILED').length);
          }
        } catch {
          if (!ignore) {
            setFailures("-");
          }
        }
      } else if (job.executions) {
        setFailures(job.executions.filter((l: CronJobExecution) => l.status === 'FAILED').length);
      }
    }
    fetchLogs();
    return () => { ignore = true; };
  }, [job]);
  return <span>{failures}</span>;
}

export const columns: ColumnDef<CronJob, unknown>[] = [
  {
    id: "name",
    accessorFn: (row) => row.name,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const job = row.original
      return (
        <div>
          <div className="font-medium">{job.name}</div>
          {job.description && (
            <div className="text-sm text-muted-foreground">{job.description}</div>
          )}
        </div>
      )
    },
  },
  {
    id: "frequency",
    accessorFn: (row) => row.frequency,
    header: "Frequency",
    cell: ({ row }) => {
      const job = row.original;
      const frequency = job.frequency as string;
      if (frequency === 'custom') {
        try {
          return (
            <span title={job.cronExpression}>
              {cronstrue.toString(job.cronExpression || '', { throwExceptionOnParseError: false })}
            </span>
          );
        } catch {
          return <span>Custom</span>;
        }
      }
      return (
        <Badge variant="outline">
          {frequency.replace(/-/g, ' ')}
        </Badge>
      );
    },
  },
  {
    id: "status",
    accessorFn: (row) => row.enabled,
    header: "Status",
    cell: ({ row }) => {
      const job = row.original
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
    },
  },
  {
    id: "lastRun",
    accessorFn: (row) => row.lastRun,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Run
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const lastRun = row.original.lastRun
      if (!lastRun) {
        return <span className="text-muted-foreground text-sm">Never</span>
      }
      return (
        <div className="text-sm">
          <div>{format(new Date(lastRun), "MMM d, yyyy")}</div>
          <div className="text-muted-foreground">
            {format(new Date(lastRun), "h:mm a")}
          </div>
        </div>
      )
    },
  },
  {
    id: "nextRun",
    accessorFn: (row) => row.nextRun,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Next Run
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const nextRun = row.original.nextRun
      if (!nextRun) {
        return <span className="text-muted-foreground text-sm">Not scheduled</span>
      }
      return (
        <div className="text-sm">
          <div>{format(new Date(nextRun), "MMM d, yyyy")}</div>
          <div className="text-muted-foreground">
            {format(new Date(nextRun), "h:mm a")}
          </div>
        </div>
      )
    },
  },
  {
    id: "successes",
    header: "Successes",
    cell: ({ row }) => <SuccessCell job={row.original} />,
  },
  {
    id: "failures",
    header: "Failures",
    cell: ({ row }) => <FailureCell job={row.original} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const job = row.original;
      return <JobActions job={job} />;
    },
  },
] 