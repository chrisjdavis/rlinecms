import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';

export const sessionRepository = {
  findById: (id: string, options?: Omit<Prisma.SessionFindUniqueArgs, 'where'>) =>
    prisma.session.findUnique({ where: { id }, ...options }),
  findByToken: (sessionToken: string, options?: Omit<Prisma.SessionFindUniqueArgs, 'where'>) =>
    prisma.session.findUnique({ where: { sessionToken }, ...options }),
  findAll: (args: Prisma.SessionFindManyArgs = {}) =>
    prisma.session.findMany(args),
  create: (data: Prisma.SessionCreateInput, options?: Omit<Prisma.SessionCreateArgs, 'data'>) =>
    prisma.session.create({ ...options, data }),
  update: (id: string, data: Prisma.SessionUpdateInput) =>
    prisma.session.update({ where: { id }, data }),
  updateByToken: (sessionToken: string, data: Prisma.SessionUpdateInput) =>
    prisma.session.update({ where: { sessionToken }, data }),
  delete: (id: string) =>
    prisma.session.delete({ where: { id } }),
  deleteByToken: (sessionToken: string) =>
    prisma.session.delete({ where: { sessionToken } }),
  deleteMany: (args: Prisma.SessionDeleteManyArgs = {}) =>
    prisma.session.deleteMany(args),
  findFirst: (args: Prisma.SessionFindFirstArgs = {}) =>
    prisma.session.findFirst(args),
  // Add more domain-specific methods as needed
}; 