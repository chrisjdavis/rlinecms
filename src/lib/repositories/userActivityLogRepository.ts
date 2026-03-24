import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { Prisma } from '@prisma/client';

export const userActivityLogRepository = {
  findById: (id: string, options?: Omit<Prisma.UserActivityLogFindUniqueArgs, 'where'>) =>
    prisma.userActivityLog.findUnique({ where: { id }, ...options }),

  findByUserId: async (userId: string) => {
    try {
      return await prisma.userActivityLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error("Error finding user activity logs", { error, userId });
      throw error;
    }
  },

  findByAction: (action: string, args: Prisma.UserActivityLogFindManyArgs = {}) =>
    prisma.userActivityLog.findMany({ where: { action }, ...args }),

  findAll: (args: Prisma.UserActivityLogFindManyArgs = {}) =>
    prisma.userActivityLog.findMany(args),

  async create(data: Prisma.UserActivityLogCreateInput) {
    try {
      return await prisma.userActivityLog.create({ data });
    } catch (error) {
      logger.error("Error creating user activity log", { error });
      throw error;
    }
  },

  update: (id: string, data: Prisma.UserActivityLogUpdateInput) =>
    prisma.userActivityLog.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.userActivityLog.delete({ where: { id } }),

  deleteByUserId: (userId: string) =>
    prisma.userActivityLog.deleteMany({ where: { userId } }),

  deleteOlderThan: (date: Date) =>
    prisma.userActivityLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    }),

  getActivitySummary: async (userId: string, startDate: Date, endDate: Date) => {
    const activities = await prisma.userActivityLog.groupBy({
      by: ['action'],
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    return activities.reduce((acc, { action, _count }) => {
      acc[action] = _count;
      return acc;
    }, {} as Record<string, number>);
  },

  async findByDateRange(startDate: Date, endDate: Date) {
    try {
      return await prisma.userActivityLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error("Error finding user activity logs by date range", { error, startDate, endDate });
      throw error;
    }
  },
}; 