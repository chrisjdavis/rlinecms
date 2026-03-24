import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export const verificationTokenRepository = {
  async create(data: Prisma.VerificationTokenCreateInput) {
    try {
      return await prisma.verificationToken.create({ data });
    } catch (error) {
      logger.error('Error creating verification token', { error });
      throw error;
    }
  },

  async findByToken(token: string) {
    try {
      return await prisma.verificationToken.findUnique({
        where: { token },
      });
    } catch (error) {
      logger.error('Error finding verification token', { error, token });
      throw error;
    }
  },

  async delete(identifier: string, token: string) {
    try {
      return await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier,
            token,
          },
        },
      });
    } catch (error) {
      logger.error('Error deleting verification token', { error, identifier, token });
      throw error;
    }
  },

  findByIdentifier: (identifier: string) =>
    prisma.verificationToken.findMany({
      where: { identifier },
    }),

  async deleteExpired(before: Date) {
    try {
      return await prisma.verificationToken.deleteMany({
        where: {
          expires: {
            lt: before,
          },
        },
      });
    } catch (error) {
      logger.error('Error deleting expired verification tokens', { error, before });
      throw error;
    }
  },
}; 