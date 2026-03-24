import { prisma } from '../prisma';
import type { Prisma, Page as PrismaPage } from '@prisma/client';

// Utility to calculate age in days between two dates (YYYY-MM-DD and ISO string)
function calculateAgeInDays(birthdate: string, date: string): number {
  const birth = new Date(birthdate);
  const target = new Date(date);
  const diff = target.getTime() - birth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export type PageWithAuthorAge = PrismaPage & { authorAgeInDays?: number };

function addAuthorAgeInDays(page: PrismaPage): PageWithAuthorAge {
  const bday = process.env.BDAY;
  if (!bday || !page?.createdAt) return page;
  return {
    ...page,
    authorAgeInDays: calculateAgeInDays(bday, page.createdAt.toISOString()),
  };
}

export const pageRepository = {
  findById: async (id: string, options?: Omit<Prisma.PageFindUniqueArgs, 'where'>) => {
    const page = await prisma.page.findUnique({ where: { id }, ...options });
    return page ? addAuthorAgeInDays(page) : page;
  },
  findBySlug: async (slug: string, options?: Omit<Prisma.PageFindUniqueArgs, 'where'>) => {
    const page = await prisma.page.findUnique({ where: { slug }, ...options });
    return page ? addAuthorAgeInDays(page) : page;
  },
  findAll: async (args: Prisma.PageFindManyArgs = {}) => {
    const pages = await prisma.page.findMany(args);
    return pages.map(addAuthorAgeInDays);
  },
  create: (data: Prisma.PageCreateInput, options?: Omit<Prisma.PageCreateArgs, 'data'>) => prisma.page.create({ ...options, data }),
  update: (id: string, data: Prisma.PageUpdateInput) => prisma.page.update({ where: { id }, data }),
  delete: (id: string) => prisma.page.delete({ where: { id } }),
  // Add more domain-specific methods as needed
}; 