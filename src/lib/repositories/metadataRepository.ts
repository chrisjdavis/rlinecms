import { prisma } from '../prisma';
import type { Prisma, Metadata } from '@prisma/client';

export const metadataRepository = {
  async create(data: Prisma.MetadataCreateInput): Promise<Metadata> {
    return prisma.metadata.create({ data });
  },
  async createMany(data: Prisma.MetadataCreateManyInput[]): Promise<void> {
    await prisma.metadata.createMany({ data });
  },
  async findById(id: string): Promise<Metadata | null> {
    return prisma.metadata.findUnique({ where: { id } });
  },
  async findAll(params: Prisma.MetadataFindManyArgs = {}): Promise<Metadata[]> {
    return prisma.metadata.findMany(params);
  },
  async delete(id: string): Promise<Metadata> {
    return prisma.metadata.delete({ where: { id } });
  },
  async deleteMany(where: Prisma.MetadataWhereInput): Promise<void> {
    await prisma.metadata.deleteMany({ where });
  },
}; 