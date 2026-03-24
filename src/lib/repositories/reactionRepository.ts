import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { Prisma, ReactionType } from '@prisma/client';

export const reactionRepository = {
  findById: (id: string, options?: Omit<Prisma.ReactionFindUniqueArgs, 'where'>) =>
    prisma.reaction.findUnique({ where: { id }, ...options }),

  findByCommentId: (commentId: string, args: Prisma.ReactionFindManyArgs = {}) =>
    prisma.reaction.findMany({ where: { commentId }, ...args }),

  findByUserId: (userId: string, args: Prisma.ReactionFindManyArgs = {}) =>
    prisma.reaction.findMany({ where: { userId }, ...args }),

  findByType: (type: ReactionType, args: Prisma.ReactionFindManyArgs = {}) =>
    prisma.reaction.findMany({ where: { type }, ...args }),

  findAll: (args: Prisma.ReactionFindManyArgs = {}) =>
    prisma.reaction.findMany(args),

  async create(data: Prisma.ReactionCreateInput) {
    try {
      return await prisma.reaction.create({ data });
    } catch (error) {
      logger.error("Error creating reaction", { error });
      throw error;
    }
  },

  update: (id: string, data: Prisma.ReactionUpdateInput) =>
    prisma.reaction.update({ where: { id }, data }),

  async delete(id: string) {
    try {
      return await prisma.reaction.delete({ where: { id } });
    } catch (error) {
      logger.error("Error deleting reaction", { error, id });
      throw error;
    }
  },

  deleteByCommentId: (commentId: string) =>
    prisma.reaction.deleteMany({ where: { commentId } }),

  deleteByUserId: (userId: string) =>
    prisma.reaction.deleteMany({ where: { userId } }),

  upsert: (data: { userId: string; commentId: string; type: ReactionType }) =>
    prisma.reaction.upsert({
      where: {
        userId_commentId_type: {
          userId: data.userId,
          commentId: data.commentId,
          type: data.type,
        },
      },
      update: {},
      create: data,
    }),

  deleteByCompositeKey: (data: { userId: string; commentId: string; type: ReactionType }) =>
    prisma.reaction.delete({
      where: {
        userId_commentId_type: {
          userId: data.userId,
          commentId: data.commentId,
          type: data.type,
        },
      },
    }),

  getReactionCounts: async (commentId: string) => {
    const reactions = await prisma.reaction.groupBy({
      by: ['type'],
      where: { commentId },
      _count: true,
    });

    return reactions.reduce((acc, { type, _count }) => {
      acc[type] = _count;
      return acc;
    }, {} as Record<ReactionType, number>);
  },

  async findByUserAndCommentId(userId: string, commentId: string) {
    try {
      return await prisma.reaction.findFirst({
        where: {
          userId,
          commentId,
        },
      });
    } catch (error) {
      logger.error("Error finding user reaction", { error, userId, commentId });
      throw error;
    }
  },
}; 