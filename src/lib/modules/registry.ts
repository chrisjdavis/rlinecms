/**
 * Module discovery and registry. Server-only (uses fs).
 * Scans src/modules/* for module.json and provides enabled modules + nav items.
 */

import path from "path"
import { promises as fs } from "fs"
import type { ModuleDescriptor, ModuleManifest, ModuleNavItem } from "./types"
import { siteSettingsRepository } from "@/lib/repositories/siteSettingsRepository"

const MODULES_DIR = path.join(process.cwd(), "src", "modules")
const MANIFEST_FILE = "module.json"

function manifestToDescriptor(manifest: ModuleManifest, pathSegment: string): ModuleDescriptor {
  return {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    version: manifest.version,
    nav: manifest.nav ?? null,
    publicApiPaths: manifest.publicApiPaths ?? [],
    adminPaths: manifest.adminPaths ?? [],
    pathSegment,
  }
}

/**
 * Scan src/modules for directories containing module.json. Sync-safe for server.
 */
export async function discoverModules(): Promise<ModuleDescriptor[]> {
  const results: ModuleDescriptor[] = []
  try {
    const entries = await fs.readdir(MODULES_DIR, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const manifestPath = path.join(MODULES_DIR, entry.name, MANIFEST_FILE)
      try {
        const content = await fs.readFile(manifestPath, "utf-8")
        const manifest = JSON.parse(content) as ModuleManifest
        if (manifest.id && manifest.name) {
          results.push(manifestToDescriptor(manifest, entry.name))
        }
      } catch {
        // No manifest or invalid - skip
      }
    }
  } catch (err) {
    // src/modules may not exist yet
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Module discovery error:", err)
    }
  }
  return results
}

/** Module IDs enabled when site settings have never stored enabledModules (fresh install). Empty = opt-in per extension after adding src/modules. */
const DEFAULT_ENABLED_MODULE_IDS: string[] = []

/**
 * Get enabled module IDs from site settings. If no site settings record exists, use DEFAULT_ENABLED_MODULE_IDS (none by default). If a record exists with an empty array, no modules are enabled.
 */
export async function getEnabledModuleIds(): Promise<string[]> {
  const stored = await siteSettingsRepository.getEnabledModules()
  if (stored === null) {
    const discovered = await discoverModules()
    const defaultSet = new Set(DEFAULT_ENABLED_MODULE_IDS)
    return discovered.map((m) => m.id).filter((id) => defaultSet.has(id))
  }
  return stored
}

/**
 * Return descriptors for modules that are both discovered and enabled.
 */
export async function getEnabledModules(): Promise<ModuleDescriptor[]> {
  const [all, enabledIds] = await Promise.all([discoverModules(), getEnabledModuleIds()])
  const set = new Set(enabledIds)
  return all.filter((m) => set.has(m.id))
}

/**
 * Nav items for enabled modules (for admin sidebar). Order matches enabled list then discovery.
 */
export async function getModuleNavItems(): Promise<ModuleNavItem[]> {
  const enabled = await getEnabledModules()
  const items: ModuleNavItem[] = []
  for (const mod of enabled) {
    if (mod.nav) {
      items.push({
        name: mod.nav.label,
        href: mod.nav.href,
        icon: mod.nav.icon,
        permission: mod.nav.permission,
      })
    }
  }
  return items
}
