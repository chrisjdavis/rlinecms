import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const cronJobExecutionRepository = {
  findById: (id: string) =>
    prisma.cronJobExecution.findUnique({ where: { id } }),

  findByCronJobId: (cronJobId: string, limit = 50) =>
    prisma.cronJobExecution.findMany({
      where: { cronJobId },
      orderBy: { startedAt: 'desc' },
      take: limit
    }),

  async create(data: {
    cronJobId: string;
    status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  }) {
    try {
      return await prisma.cronJobExecution.create({
        data: {
          cronJobId: data.cronJobId,
          status: data.status
        }
      });
    } catch (error) {
      logger.error('Error creating cron job execution', { error, data });
      throw error;
    }
  },

  async update(id: string, data: {
    status?: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
    completedAt?: Date;
    duration?: number;
    response?: string;
    error?: string;
    httpStatus?: number;
  }) {
    try {
      return await prisma.cronJobExecution.update({
        where: { id },
        data
      });
    } catch (error) {
      logger.error('Error updating cron job execution', { error, id, data });
      throw error;
    }
  },

  async getStats(cronJobId: string) {
    try {
      const [total, successful, failed, avgDuration, lastExecution] = await Promise.all([
        prisma.cronJobExecution.count({ where: { cronJobId } }),
        prisma.cronJobExecution.count({ 
          where: { cronJobId, status: 'SUCCESS' } 
        }),
        prisma.cronJobExecution.count({ 
          where: { cronJobId, status: { in: ['FAILED', 'TIMEOUT'] } } 
        }),
        prisma.cronJobExecution.aggregate({
          where: { cronJobId, duration: { not: null } },
          _avg: { duration: true }
        }),
        prisma.cronJobExecution.findFirst({
          where: { cronJobId },
          orderBy: { startedAt: 'desc' },
          select: { startedAt: true, status: true }
        })
      ]);

      return {
        totalExecutions: total,
        successfulExecutions: successful,
        failedExecutions: failed,
        averageDuration: avgDuration._avg.duration || 0,
        lastExecution: lastExecution?.startedAt,
        successRate: total > 0 ? (successful / total) * 100 : 0
      };
    } catch (error) {
      logger.error('Error getting cron job stats', { error, cronJobId });
      throw error;
    }
  },

  async cleanupOldExecutions(olderThanDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.cronJobExecution.deleteMany({
        where: {
          startedAt: {
            lt: cutoffDate
          }
        }
      });

      logger.info('Cleaned up old cron job executions', { 
        deletedCount: result.count, 
        cutoffDate 
      });

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old executions', { error });
      throw error;
    }
  },

  async findRunningExecutions(cronJobId: string) {
    try {
      return await prisma.cronJobExecution.findMany({
        where: {
          cronJobId,
          status: 'RUNNING'
        }
      });
    } catch (error) {
      logger.error('Error finding running executions', { error, cronJobId });
      throw error;
    }
  },

  async markStaleExecutionsAsTimeout(timeoutMinutes = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMinutes(cutoffDate.getMinutes() - timeoutMinutes);

      const result = await prisma.cronJobExecution.updateMany({
        where: {
          status: 'RUNNING',
          startedAt: {
            lt: cutoffDate
          }
        },
        data: {
          status: 'TIMEOUT',
          completedAt: new Date()
        }
      });

      if (result.count > 0) {
        logger.info('Marked stale executions as timeout', { 
          count: result.count, 
          timeoutMinutes 
        });
      }

      return result.count;
    } catch (error) {
      logger.error('Error marking stale executions as timeout', { error });
      throw error;
    }
  }
}; 