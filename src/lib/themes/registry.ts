/**
 * Which public theme folders are enabled (ids match directories under src/components/theme with theme.json).
 * RLine ships with Minimal only; when there is no site settings record, all discovered folders—including minimal—are enabled.
 */

import { discoverThemes } from "./discovery"
import { siteSettingsRepository } from "@/lib/repositories/siteSettingsRepository"

export async function getEnabledThemeIds(): Promise<string[]> {
  const stored = await siteSettingsRepository.getEnabledThemes()
  if (stored === null) {
    const discovered = await discoverThemes()
    return discovered.map((t) => t.id)
  }
  return stored
}

export { discoverThemes }
