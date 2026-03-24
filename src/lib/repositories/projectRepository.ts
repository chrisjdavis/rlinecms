import { prisma } from '../prisma'
import type { Prisma } from '@prisma/client'

export const projectRepository = {
  findById: async (id: string, options?: Omit<Prisma.ProjectFindUniqueArgs, 'where'>) => {
    return prisma.project.findUnique({ where: { id }, ...options })
  },

  findAll: async (args: Prisma.ProjectFindManyArgs = {}) => {
    return prisma.project.findMany(args)
  },

  count: (args: Prisma.ProjectCountArgs = {}) => prisma.project.count(args),

  create: (data: Prisma.ProjectCreateInput, options?: Omit<Prisma.ProjectCreateArgs, 'data'>) => {
    return prisma.project.create({ ...options, data })
  },

  update: (id: string, data: Prisma.ProjectUpdateInput) => {
    return prisma.project.update({ where: { id }, data })
  },

  delete: (id: string) => prisma.project.delete({ where: { id } }),

  findPublished: async (args: Prisma.ProjectFindManyArgs = {}) => {
    return prisma.project.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { carouselOrder: 'asc' },
      ...args,
    })
  },
}
