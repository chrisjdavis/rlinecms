import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';

export const commentRepository = {
  findById: (id: string, options?: Omit<Prisma.CommentFindUniqueArgs, 'where'>) =>
    prisma.comment.findUnique({ where: { id }, ...options }),
  findAll: (args: Prisma.CommentFindManyArgs = {}) =>
    prisma.comment.findMany(args),
  findByPostId: (postId: string, args: Prisma.CommentFindManyArgs = {}) =>
    prisma.comment.findMany({ where: { postId }, ...args }),
  findByAuthorId: (authorId: string, args: Prisma.CommentFindManyArgs = {}) =>
    prisma.comment.findMany({ where: { authorId }, ...args }),
  findReplies: (parentId: string, args: Prisma.CommentFindManyArgs = {}) =>
    prisma.comment.findMany({ where: { parentId }, ...args }),
  create: (data: Prisma.CommentCreateInput, options?: Omit<Prisma.CommentCreateArgs, 'data'>) =>
    prisma.comment.create({ ...options, data }),
  update: (id: string, data: Prisma.CommentUpdateInput) =>
    prisma.comment.update({ where: { id }, data }),
  delete: (id: string) =>
    prisma.comment.delete({ where: { id } }),
  // Add more domain-specific methods as needed
}; 