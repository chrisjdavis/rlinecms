import { logger } from '@/lib/logger';
import type { EasyCronJob } from '@/types/cron';

type EasyCronApiJob = {
  cron_job_id: string;
  cron_job_name: string;
  url: string;
  cron_expression: string;
  status: number | string;
  updated: string;
  // add any other fields as needed
};

export class EasyCronService {
  private apiKey: string;
  private baseUrl = 'https://www.easycron.com/rest';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string, method: string = 'GET', params?: Record<string, unknown>): Promise<T> {
    // Build query string from params
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('token', this.apiKey);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value as string);
      }
    }

    logger.info('Making EasyCron API request', { 
      url: url.toString(), 
      method,
      params,
      hasApiKey: !!this.apiKey 
    });

    const response = await fetch(url.toString(), { method });

    logger.info('EasyCron API response received', { 
      status: response.status,
      statusText: response.statusText,
      url: url.toString()
    });

    const data = await response.json();
    logger.info('EasyCron API response data', { data });

    if (data.status === 'error') {
      throw new Error(data.error?.message || 'EasyCron API returned an error');
    }

    return data;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/list');
      return true;
    } catch (error) {
      logger.error('EasyCron connection test failed', { error });
      return false;
    }
  }

  async listJobs(): Promise<EasyCronJob[]> {
    try {
      const response = await this.makeRequest<{ cron_jobs: EasyCronApiJob[] }>('/list');
      const jobs = (response.cron_jobs || []).map(job => ({
        id: job.cron_job_id.toString(),
        name: job.cron_job_name,
        url: job.url,
        cron: job.cron_expression,
        enabled: job.status === '1' || job.status === 1,
        last_run: job.updated,
        next_run: null
      }));
      return jobs;
    } catch (error) {
      logger.error('Failed to list EasyCron jobs', { error });
      throw error;
    }
  }

  async createJob(data: {
    name: string;
    url: string;
    cron: string;
    enabled?: boolean;
  }): Promise<{ id: string }> {
    try {
      // Only use 5-field cron expressions
      const cronParts = data.cron.trim().split(' ');
      const cron = cronParts.length === 6 ? cronParts.slice(1).join(' ') : data.cron.trim();
      const params: Record<string, unknown> = {
        url: data.url,
        cron_expression: cron,
        cron_job_name: data.name,
        status: data.enabled !== false ? '1' : '0'
      };
      logger.info('Creating EasyCron job', { params });
      const response = await this.makeRequest<{ cron_job_id: string }>('/add', 'GET', params);
      logger.info('EasyCron job created successfully', { response });
      return { id: response.cron_job_id };
    } catch (error) {
      logger.error('Failed to create EasyCron job', { error, data });
      throw error;
    }
  }

  async updateJob(jobId: string, data: {
    name?: string;
    url?: string;
    cron?: string;
    enabled?: boolean;
  }): Promise<void> {
    try {
      const params: Record<string, unknown> = { id: jobId };
      if (data.name) params.cron_job_name = data.name;
      if (data.url) params.url = data.url;
      if (data.cron) {
        const cronParts = data.cron.trim().split(' ');
        params.cron_expression = cronParts.length === 6 ? cronParts.slice(1).join(' ') : data.cron.trim();
      }
      if (data.enabled !== undefined) params.status = data.enabled ? '1' : '0';
      await this.makeRequest('/edit', 'GET', params);
      logger.info('EasyCron job updated successfully', { jobId, data });
    } catch (error) {
      logger.error('Failed to update EasyCron job', { error, jobId, data });
      throw error;
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      await this.makeRequest('/delete', 'GET', { id: jobId });
    } catch (error) {
      logger.error('Failed to delete EasyCron job', { error, jobId });
      throw error;
    }
  }

  async enableJob(jobId: string): Promise<void> {
    try {
      await this.makeRequest(`/cron-jobs/${jobId}`, 'PATCH', { status: 1 });
    } catch (error) {
      logger.error('Failed to enable EasyCron job', { error, jobId });
      throw error;
    }
  }

  async disableJob(jobId: string): Promise<void> {
    try {
      await this.makeRequest(`/cron-jobs/${jobId}`, 'PATCH', { status: 0 });
    } catch (error) {
      logger.error('Failed to disable EasyCron job', { error, jobId });
      throw error;
    }
  }

  async getJobDetails(jobId: string): Promise<EasyCronJob> {
    try {
      logger.info('Getting EasyCron job details', { jobId });
      const response = await this.makeRequest<{ cron_job: EasyCronApiJob }>('/detail', 'GET', { id: jobId });
      logger.info('Job details response', { response });
      const job = response.cron_job;
      return {
        id: job.cron_job_id.toString(),
        name: job.cron_job_name,
        url: job.url,
        cron: job.cron_expression,
        enabled: job.status === '1' || job.status === 1,
        last_run: job.updated,
        next_run: null
      };
    } catch (error) {
      logger.error('Failed to get EasyCron job details', { error, jobId });
      throw error;
    }
  }

  async executeJob(jobId: string): Promise<void> {
    try {
      await this.makeRequest(`/cron-jobs/${jobId}/execute`, 'POST');
    } catch (error) {
      logger.error('Failed to execute EasyCron job', { error, jobId });
      throw error;
    }
  }

  async getJobLogs(jobId: string, limit = 10): Promise<unknown[]> {
    try {
      const response = await this.makeRequest<{ logs: unknown[] }>(`/cron-jobs/${jobId}/logs?limit=${limit}`);
      return response.logs || [];
    } catch (error) {
      logger.error('Failed to get EasyCron job logs', { error, jobId });
      throw error;
    }
  }
}

export function createEasyCronService(apiKey: string): EasyCronService {
  return new EasyCronService(apiKey);
} 