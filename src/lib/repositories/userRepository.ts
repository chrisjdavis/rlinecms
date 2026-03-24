import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';

export const userRepository = {
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  findByEmail: (email: string) => prisma.user.findUnique({ 
    where: { email }
  }),
  findByUsername: (username: string) => prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive'
      }
    }
  }),
  findByVerificationToken: (token: string) => prisma.user.findFirst({
    where: { emailVerificationToken: token },
    select: {
      id: true,
      emailVerificationExpires: true,
      emailVerified: true,
    },
  }),
  findByResetToken: (token: string) => prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: {
        gt: new Date(),
      },
    },
  }),
  findAll: (args: Prisma.UserFindManyArgs = {}) => prisma.user.findMany(args),
  create: (data: Prisma.UserCreateInput) => prisma.user.create({ data }),
  update: (id: string, data: Prisma.UserUpdateInput) => prisma.user.update({ where: { id }, data }),
  delete: (id: string) => prisma.user.delete({ where: { id } }),
  // Add more domain-specific methods as needed
}; 