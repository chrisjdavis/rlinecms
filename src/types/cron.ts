import { CronFrequencyValue } from '@/lib/constants/cronFrequencies';

export interface CronJob {
  id: string;
  name: string;
  description?: string;
  url: string;
  frequency: CronFrequencyValue;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  easycronJobId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  executions?: CronJobExecution[];
}

export interface CronJobExecution {
  id: string;
  cronJobId: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  response?: string;
  error?: string;
  httpStatus?: number;
}

export interface CreateCronJobData {
  name: string;
  description?: string;
  url: string;
  frequency: CronFrequencyValue;
  customExpression?: string;
}

export interface UpdateCronJobData {
  name?: string;
  description?: string;
  url?: string;
  frequency?: CronFrequencyValue;
  customExpression?: string;
  enabled?: boolean;
}

export interface EasyCronConfig {
  apiKey: string;
  enabled: boolean;
  webhookUrl?: string;
}

export interface CronJobStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecution?: Date;
  successRate: number;
}

export interface EasyCronJob {
  id: string;
  name: string;
  url: string;
  cron: string;
  enabled: boolean;
  last_run?: string;
  next_run?: string | null;
} 