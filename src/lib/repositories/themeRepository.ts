import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { Prisma, ThemeType } from '@prisma/client';

export const themeRepository = {
  findById: (id: string, options?: Omit<Prisma.ThemeFindUniqueArgs, 'where'>) =>
    prisma.theme.findUnique({ where: { id }, ...options }),

  findByAuthorId: (authorId: string, args: Prisma.ThemeFindManyArgs = {}) =>
    prisma.theme.findMany({ where: { authorId }, ...args }),

  findByType: (type: ThemeType, args: Prisma.ThemeFindManyArgs = {}) =>
    prisma.theme.findMany({ where: { type }, ...args }),

  findActive: (type: ThemeType) =>
    prisma.theme.findFirst({
      where: {
        type,
        isActive: true,
      },
    }),

  findAll: (args: Prisma.ThemeFindManyArgs = {}) =>
    prisma.theme.findMany(args),

  findFirst: (args: Prisma.ThemeFindFirstArgs = {}) =>
    prisma.theme.findFirst(args),

  findByName: (name: string, options?: Omit<Prisma.ThemeFindFirstArgs, 'where'>) =>
    prisma.theme.findFirst({ where: { name }, ...options }),

  async create(data: Prisma.ThemeCreateInput) {
    try {
      return await prisma.theme.create({ data });
    } catch (error) {
      logger.error("Error creating theme", { error });
      throw error;
    }
  },

  async update(id: string, data: Prisma.ThemeUpdateInput) {
    try {
      return await prisma.theme.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error("Error updating theme", { error, id });
      throw error;
    }
  },

  updateMany: (args: Prisma.ThemeUpdateManyArgs) =>
    prisma.theme.updateMany(args),

  async delete(id: string) {
    try {
      return await prisma.theme.delete({
        where: { id },
      });
    } catch (error) {
      logger.error("Error deleting theme", { error, id });
      throw error;
    }
  },

  deleteByAuthorId: (authorId: string) =>
    prisma.theme.deleteMany({ where: { authorId } }),

  setActive: async (id: string, type: ThemeType) => {
    // First, deactivate all themes of the same type
    await prisma.theme.updateMany({
      where: {
        type,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Then activate the specified theme
    return prisma.theme.update({
      where: { id },
      data: {
        isActive: true,
      },
    });
  },

  // Add more domain-specific methods as needed
}; 