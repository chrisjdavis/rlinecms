import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';

export const apiKeyRepository = {
  findById: async (id: string, options?: Omit<Prisma.ApiKeyFindUniqueArgs, 'where'>) => {
    return prisma.apiKey.findUnique({ where: { id }, ...options });
  },
  
  findByKey: async (key: string, options?: Omit<Prisma.ApiKeyFindUniqueArgs, 'where'>) => {
    return prisma.apiKey.findUnique({ where: { key }, ...options });
  },
  
  findAll: async (args: Prisma.ApiKeyFindManyArgs = {}) => {
    return prisma.apiKey.findMany(args);
  },
  
  count: (args: Prisma.ApiKeyCountArgs = {}) => prisma.apiKey.count(args),
  
  create: (data: Prisma.ApiKeyCreateInput, options?: Omit<Prisma.ApiKeyCreateArgs, 'data'>) => {
    return prisma.apiKey.create({ ...options, data });
  },
  
  update: (id: string, data: Prisma.ApiKeyUpdateInput) => {
    return prisma.apiKey.update({ where: { id }, data });
  },
  
  delete: (id: string) => prisma.apiKey.delete({ where: { id } }),
  
  updateLastUsed: async (key: string) => {
    return prisma.apiKey.update({
      where: { key },
      data: { lastUsedAt: new Date() },
    });
  },
  
  findActiveByKey: async (key: string) => {
    return prisma.apiKey.findFirst({
      where: {
        key,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });
  },
};
