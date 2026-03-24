import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';

export const userPreferenceRepository = {
  findById: (id: string, options?: Omit<Prisma.UserPreferenceFindUniqueArgs, 'where'>) =>
    prisma.userPreference.findUnique({ where: { id }, ...options }),
  findByUserId: (userId: string, options?: Omit<Prisma.UserPreferenceFindUniqueArgs, 'where'>) =>
    prisma.userPreference.findUnique({ where: { userId }, ...options }),
  findAll: (args: Prisma.UserPreferenceFindManyArgs = {}) =>
    prisma.userPreference.findMany(args),
  create: (data: Prisma.UserPreferenceCreateInput, options?: Omit<Prisma.UserPreferenceCreateArgs, 'data'>) =>
    prisma.userPreference.create({ ...options, data }),
  update: (id: string, data: Prisma.UserPreferenceUpdateInput) =>
    prisma.userPreference.update({ where: { id }, data }),
  updateByUserId: (userId: string, data: Prisma.UserPreferenceUpdateInput) =>
    prisma.userPreference.update({ where: { userId }, data }),
  delete: (id: string) =>
    prisma.userPreference.delete({ where: { id } }),
  // Add more domain-specific methods as needed
}; 