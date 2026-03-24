import { NextResponse } from 'next/server';
import { themeRepository } from '@/lib/repositories/themeRepository';
import { getEnabledThemeIds } from '@/lib/themes/registry';
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const [enabledIds, activeTheme] = await Promise.all([
      getEnabledThemeIds(),
      themeRepository.findFirst({ where: { isActive: true }, select: { id: true } }),
    ]);
    const themes = await themeRepository.findAll({
      where: enabledIds.length > 0 ? { themePath: { in: enabledIds } } : undefined,
      select: {
        id: true,
        name: true,
        themePath: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({
      themes,
      activeThemeId: activeTheme?.id ?? null,
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Minimal theme options' },
      { status: 500 }
    );
  }
} 