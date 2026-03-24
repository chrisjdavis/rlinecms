import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { Prisma, NavLocation } from '@prisma/client';

export const navigationItemRepository = {
  findById: (id: string, options?: Omit<Prisma.NavigationItemFindUniqueArgs, 'where'>) =>
    prisma.navigationItem.findUnique({ where: { id }, ...options }),

  findBySettingsId: (settingsId: string, args: Prisma.NavigationItemFindManyArgs = {}) =>
    prisma.navigationItem.findMany({ where: { settingsId }, ...args }),

  findByLocation: (settingsId: string, location: NavLocation, args: Prisma.NavigationItemFindManyArgs = {}) =>
    prisma.navigationItem.findMany({
      where: { settingsId, location },
      orderBy: { order: 'asc' },
      ...args,
    }),

  findAll: (args: Prisma.NavigationItemFindManyArgs = {}) =>
    prisma.navigationItem.findMany(args),

  async create(data: Prisma.NavigationItemCreateInput) {
    try {
      return await prisma.navigationItem.create({ data });
    } catch (error) {
      logger.error("Error creating navigation item", { error });
      throw error;
    }
  },

  async update(id: string, data: Prisma.NavigationItemUpdateInput) {
    try {
      return await prisma.navigationItem.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error("Error updating navigation item", { error, id });
      throw error;
    }
  },

  updateOrder: (id: string, order: number) =>
    prisma.navigationItem.update({
      where: { id },
      data: { order },
    }),

  async delete(id: string) {
    try {
      return await prisma.navigationItem.delete({
        where: { id },
      });
    } catch (error) {
      logger.error("Error deleting navigation item", { error, id });
      throw error;
    }
  },

  deleteBySettingsId: (settingsId: string) =>
    prisma.navigationItem.deleteMany({ where: { settingsId } }),

  reorder: async (settingsId: string, location: NavLocation, items: { id: string; order: number }[]) => {
    const updates = items.map(({ id, order }) =>
      prisma.navigationItem.update({
        where: { id },
        data: { order },
      })
    );
    return prisma.$transaction(updates);
  },
}; 