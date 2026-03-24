import { userActivityLogRepository } from '@/lib/repositories/userActivityLogRepository';
import type { Prisma } from '@prisma/client';

interface LogUserActivityOptions {
  userId: string;
  action: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logUserActivity({ userId, action, ip, userAgent, metadata }: LogUserActivityOptions) {
  const data: Prisma.UserActivityLogCreateInput = {
    user: {
      connect: {
        id: userId
      }
    },
    action,
    ip,
    userAgent,
    metadata: metadata as Prisma.InputJsonValue,
  };

  return userActivityLogRepository.create(data);
} 