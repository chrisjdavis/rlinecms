import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';

export const blockRepository = {
  findById: (id: string, options?: Omit<Prisma.BlockFindUniqueArgs, 'where'>) =>
    prisma.block.findUnique({ where: { id }, ...options }),
  findAll: (args: Prisma.BlockFindManyArgs = {}) =>
    prisma.block.findMany(args),
  findByPostId: (postId: string, args: Prisma.BlockFindManyArgs = {}) =>
    prisma.block.findMany({ where: { postId }, ...args }),
  findByPageId: (pageId: string, args: Prisma.BlockFindManyArgs = {}) =>
    prisma.block.findMany({ where: { pageId }, ...args }),
  create: (data: Prisma.BlockCreateInput, options?: Omit<Prisma.BlockCreateArgs, 'data'>) =>
    prisma.block.create({ ...options, data }),
  update: (id: string, data: Prisma.BlockUpdateInput) =>
    prisma.block.update({ where: { id }, data }),
  delete: (id: string) =>
    prisma.block.delete({ where: { id } }),
  deleteAll: () => prisma.block.deleteMany(),
  // Add more domain-specific methods as needed
}; 