import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import type { CreateCronJobData, UpdateCronJobData } from '@/types/cron';
import { getCronExpression } from '@/lib/constants/cronFrequencies';

export const cronJobRepository = {
  findById: (id: string, options?: Omit<Prisma.CronJobFindUniqueArgs, 'where'>) =>
    prisma.cronJob.findUnique({ 
      where: { id }, 
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 10
        }
      },
      ...options 
    }),

  findAll: (args: Prisma.CronJobFindManyArgs = {}) =>
    prisma.cronJob.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      },
      ...args
    }),

  findByUserId: (userId: string, args: Prisma.CronJobFindManyArgs = {}) =>
    prisma.cronJob.findMany({ 
      where: { createdBy: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 1
        }
      },
      ...args 
    }),

  findEnabled: () =>
    prisma.cronJob.findMany({
      where: { enabled: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),

  async create(data: CreateCronJobData, userId: string) {
    try {
      const cronExpression = getCronExpression(data.frequency, data.customExpression);
      
      return await prisma.cronJob.create({
        data: {
          name: data.name,
          description: data.description,
          url: data.url,
          frequency: data.frequency,
          cronExpression,
          createdBy: userId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error creating cron job', { error, data, userId });
      throw error;
    }
  },

  async update(id: string, data: UpdateCronJobData) {
    try {
      const updateData: Prisma.CronJobUpdateInput = {
        name: data.name,
        description: data.description,
        url: data.url,
        enabled: data.enabled
      };

      if (data.frequency) {
        updateData.frequency = data.frequency;
        updateData.cronExpression = getCronExpression(data.frequency, data.customExpression);
      }

      return await prisma.cronJob.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error updating cron job', { error, id, data });
      throw error;
    }
  },

  async delete(id: string) {
    try {
      return await prisma.cronJob.delete({ where: { id } });
    } catch (error) {
      logger.error('Error deleting cron job', { error, id });
      throw error;
    }
  },

  async updateLastRun(id: string, lastRun: Date) {
    try {
      return await prisma.cronJob.update({
        where: { id },
        data: { lastRun }
      });
    } catch (error) {
      logger.error('Error updating cron job last run', { error, id, lastRun });
      throw error;
    }
  },

  async updateNextRun(id: string, nextRun: Date) {
    try {
      return await prisma.cronJob.update({
        where: { id },
        data: { nextRun }
      });
    } catch (error) {
      logger.error('Error updating cron job next run', { error, id, nextRun });
      throw error;
    }
  },

  async updateEasyCronJobId(id: string, easycronJobId: string) {
    try {
      logger.info('Updating EasyCron job ID', { id, easycronJobId });
      
      const result = await prisma.cronJob.update({
        where: { id },
        data: { easycronJobId }
      });
      
      logger.info('EasyCron job ID updated successfully', { id, easycronJobId });
      return result;
    } catch (error) {
      logger.error('Error updating EasyCron job ID', { 
        error: error instanceof Error ? error.message : error,
        id, 
        easycronJobId 
      });
      throw error;
    }
  },

  async findJobsNeedingSync() {
    try {
      return await prisma.cronJob.findMany({
        where: {
          enabled: true,
          easycronJobId: null
        }
      });
    } catch (error) {
      logger.error('Error finding jobs needing sync', { error });
      throw error;
    }
  }
}; 