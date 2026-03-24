import { prisma } from '../prisma';
import type { Post, Prisma } from '@prisma/client';
import { Status } from '@prisma/client';

// Add this type to extend Post with authorAgeInDays
export type PostWithAuthorAge = Post & { authorAgeInDays?: number };

// Utility to calculate age in days between two dates (YYYY-MM-DD and ISO string)
function calculateAgeInDays(birthdate: string, date: string): number {
  const birth = new Date(birthdate);
  const target = new Date(date);
  const diff = target.getTime() - birth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function addAuthorAgeInDays<T extends { createdAt: Date }>(post: T): T & { authorAgeInDays?: number } {
  try {
    const bday = process.env.BDAY || process.env.NEXT_PUBLIC_BDAY;
    if (!bday || !post?.createdAt) return post;
    
    const createdAt = post.createdAt instanceof Date 
      ? post.createdAt.toISOString() 
      : typeof post.createdAt === 'string' 
        ? post.createdAt 
        : null;
        
    if (!createdAt) return post;
    
    return {
      ...post,
      authorAgeInDays: calculateAgeInDays(bday, createdAt),
    };
  } catch (error) {
    console.error('Error calculating author age:', error);
    return post;
  }
}

export const postRepository = {
  findById: async (id: string, options?: Omit<Prisma.PostFindUniqueArgs, 'where'>) => {
    const post = await prisma.post.findUnique({ where: { id }, ...options });
    return post ? addAuthorAgeInDays(post) : post;
  },
  findBySlug: async (slug: string, options?: Omit<Prisma.PostFindUniqueArgs, 'where'>) => {
    const post = await prisma.post.findUnique({ where: { slug }, ...options });
    return post ? addAuthorAgeInDays(post) : post;
  },
  /**
   * Public post by slug (published only). Pass `include` or `select` as for `findFirst`.
   * Return type matches Prisma payload for `args` (plus optional `authorAgeInDays`).
   */
  findPublishedBySlug: async <T extends Omit<Prisma.PostFindFirstArgs, 'where'>>(
    slug: string,
    args: T
  ) => {
    const post = await prisma.post.findFirst({
      where: { slug, status: Status.PUBLISHED },
      ...args,
    });
    return (post ? addAuthorAgeInDays(post) : null) as
      | (Prisma.PostGetPayload<{ where: { slug: string; status: Status } } & T> & {
          authorAgeInDays?: number
        })
      | null;
  },
  findAll: async (args: Prisma.PostFindManyArgs = {}) => {
    const posts = await prisma.post.findMany(args);
    return posts.map(addAuthorAgeInDays);
  },
  count: (args: Prisma.PostCountArgs = {}) => prisma.post.count(args),
  create: (data: Prisma.PostCreateInput, options?: Omit<Prisma.PostCreateArgs, 'data'>) => prisma.post.create({ ...options, data }),
  update: (id: string, data: Prisma.PostUpdateInput) => prisma.post.update({ where: { id }, data }),
  delete: (id: string) => prisma.post.delete({ where: { id } }),
  findOldest: (select?: Prisma.PostSelect) =>
    prisma.post.findFirst({
      orderBy: {
        createdAt: 'asc'
      },
      select: select || { createdAt: true }
    }),
  // Add more domain-specific methods as needed
}; 