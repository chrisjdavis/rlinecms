import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';
import { ActivityLogFilters } from './ActivityLogFilters';

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Await searchParams as required by Next.js
  const params = await searchParams;
  const userId = typeof params?.userId === 'string' ? params.userId : undefined;
  const action = typeof params?.action === 'string' ? params.action : undefined;
  const startDate =
    typeof params?.startDate === 'string'
      ? new Date(params.startDate)
      : subDays(new Date(), 7);
  const endDate =
    typeof params?.endDate === 'string'
      ? new Date(params.endDate)
      : new Date();

  // Fetch logs with filters
  const logs = await prisma.userActivityLog.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(action ? { action } : {}),
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // TODO: add pagination
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">User Activity Log</h3>
          <p className="text-sm text-muted-foreground">
            View and filter user activity across the site.
          </p>
        </div>
      </div>
      <ActivityLogFilters />
      <DataTable columns={columns} data={logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
        metadata:
          log.metadata && !Array.isArray(log.metadata) && typeof log.metadata === 'object'
            ? log.metadata
            : null,
      }))} searchKey="action" />
    </div>
  );
} 