import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export const rebuildLogRepository = {
  findById: (id: string, options?: Omit<Prisma.RebuildLogFindUniqueArgs, 'where'>) =>
    prisma.rebuildLog.findUnique({ where: { id }, ...options }),

  findByUserId: (userId: string, args: Prisma.RebuildLogFindManyArgs = {}) =>
    prisma.rebuildLog.findMany({ where: { userId }, ...args }),

  findAll: (args: Prisma.RebuildLogFindManyArgs = {}) =>
    prisma.rebuildLog.findMany(args),

  async create(data: Prisma.RebuildLogCreateInput) {
    try {
      return await prisma.rebuildLog.create({ data });
    } catch (error) {
      logger.error("Error creating rebuild log", { error });
      throw error;
    }
  },

  update: (id: string, data: Prisma.RebuildLogUpdateInput) =>
    prisma.rebuildLog.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.rebuildLog.delete({ where: { id } }),

  deleteByUserId: (userId: string) =>
    prisma.rebuildLog.deleteMany({ where: { userId } }),

  deleteOlderThan: (date: Date) =>
    prisma.rebuildLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    }),

  async findLatest() {
    try {
      return await prisma.rebuildLog.findFirst({
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error("Error finding latest rebuild log", { error });
      throw error;
    }
  },

  async findByDateRange(startDate: Date, endDate: Date) {
    try {
      return await prisma.rebuildLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      logger.error("Error finding rebuild logs by date range", { error, startDate, endDate });
      throw error;
    }
  },
}; 