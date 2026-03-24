import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';

export const profileLinkRepository = {
  findById: (id: string, options?: Omit<Prisma.ProfileLinkFindUniqueArgs, 'where'>) =>
    prisma.profileLink.findUnique({ where: { id }, ...options }),
  findByUserId: (userId: string, args: Prisma.ProfileLinkFindManyArgs = {}) =>
    prisma.profileLink.findMany({ where: { userId }, ...args }),
  findAll: (args: Prisma.ProfileLinkFindManyArgs = {}) =>
    prisma.profileLink.findMany(args),
  create: (data: Prisma.ProfileLinkCreateInput, options?: Omit<Prisma.ProfileLinkCreateArgs, 'data'>) =>
    prisma.profileLink.create({ ...options, data }),
  update: (id: string, data: Prisma.ProfileLinkUpdateInput) =>
    prisma.profileLink.update({ where: { id }, data }),
  delete: (id: string) =>
    prisma.profileLink.delete({ where: { id } }),
  // Add more domain-specific methods as needed
}; 