import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export const accountRepository = {
  findById: (id: string, options?: Omit<Prisma.AccountFindUniqueArgs, 'where'>) =>
    prisma.account.findUnique({ where: { id }, ...options }),

  findByProviderAccountId: (provider: string, providerAccountId: string) =>
    prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
    }),

  findByUserId: (userId: string, args: Prisma.AccountFindManyArgs = {}) =>
    prisma.account.findMany({ where: { userId }, ...args }),

  findAll: (args: Prisma.AccountFindManyArgs = {}) =>
    prisma.account.findMany(args),

  async create(data: Prisma.AccountCreateInput) {
    try {
      return await prisma.account.create({ data });
    } catch (error) {
      logger.error("Error creating account", { error });
      throw error;
    }
  },

  update: (id: string, data: Prisma.AccountUpdateInput) =>
    prisma.account.update({ where: { id }, data }),

  async delete(id: string) {
    try {
      return await prisma.account.delete({ where: { id } });
    } catch (error) {
      logger.error("Error deleting account", { error, id });
      throw error;
    }
  },

  deleteByUserId: (userId: string) =>
    prisma.account.deleteMany({ where: { userId } }),

  async findByProviderAndProviderAccountId(
    provider: string,
    providerAccountId: string
  ) {
    try {
      return await prisma.account.findFirst({
        where: {
          provider,
          providerAccountId,
        },
      });
    } catch (error) {
      logger.error("Error finding account", { error, provider, providerAccountId });
      throw error;
    }
  },
}; 