import { prisma } from '../prisma';
import type { Prisma } from '@prisma/client';

export const siteSettingsRepository = {
  findById: (id: string, options?: Omit<Prisma.SiteSettingsFindUniqueArgs, 'where'>) =>
    prisma.siteSettings.findUnique({ where: { id }, ...options }),
  findAll: (args: Prisma.SiteSettingsFindManyArgs = {}) =>
    prisma.siteSettings.findMany(args),
  findFirst: (args: Prisma.SiteSettingsFindFirstArgs = {}) =>
    prisma.siteSettings.findFirst(args),
  create: (data: Prisma.SiteSettingsCreateInput, options?: Omit<Prisma.SiteSettingsCreateArgs, 'data'>) =>
    prisma.siteSettings.create({ ...options, data }),
  update: (id: string, data: Prisma.SiteSettingsUpdateInput) =>
    prisma.siteSettings.update({ where: { id }, data }),
  updateMany: (args: Prisma.SiteSettingsUpdateManyArgs) =>
    prisma.siteSettings.updateMany(args),
  delete: (id: string) =>
    prisma.siteSettings.delete({ where: { id } }),
  upsert: (args: Prisma.SiteSettingsUpsertArgs) =>
    prisma.siteSettings.upsert(args),

  /** Get enabled module IDs from the first site settings record. Returns null if no record (so caller can default to "all"). */
  getEnabledModules: async (): Promise<string[] | null> => {
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (!settings) return null;
    if (settings.enabledModules == null) return [];
    const raw = settings.enabledModules;
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === 'string') return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    return [];
  },

  /** Set enabled module IDs on the first site settings record. */
  setEnabledModules: async (moduleIds: string[]): Promise<void> => {
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (!settings) return;
    await prisma.siteSettings.update({
      where: { id: settings.id },
      data: { enabledModules: moduleIds },
    });
  },

  /** Get enabled theme path IDs (e.g. ["minimal"]). Returns null if no settings record. */
  getEnabledThemes: async (): Promise<string[] | null> => {
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (!settings) return null;
    if (settings.enabledThemes == null) return [];
    const raw = settings.enabledThemes;
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === 'string') return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    return [];
  },

  /** Set enabled theme path IDs on the first site settings record. */
  setEnabledThemes: async (themeIds: string[]): Promise<void> => {
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (!settings) return;
    await prisma.siteSettings.update({
      where: { id: settings.id },
      data: { enabledThemes: themeIds },
    });
  },
}; 