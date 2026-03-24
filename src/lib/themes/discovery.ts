/**
 * Discover public theme folders under src/components/theme (each needs theme.json). The bundled theme is Minimal.
 * Server-only (uses fs).
 */

import path from "path"
import { promises as fs } from "fs"

const THEMES_DIR = path.join(process.cwd(), "src", "components", "theme")

export interface DiscoveredTheme {
  id: string
  name: string
  description?: string
  version?: string
}

export async function discoverThemes(): Promise<DiscoveredTheme[]> {
  const results: DiscoveredTheme[] = []
  try {
    const entries = await fs.readdir(THEMES_DIR, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      // Skip "admin" and other non-public theme folders
      if (entry.name === "admin" || entry.name.startsWith("_")) continue
      const configPath = path.join(THEMES_DIR, entry.name, "theme.json")
      try {
        const content = await fs.readFile(configPath, "utf-8")
        const config = JSON.parse(content) as { name?: string; description?: string; version?: string }
        results.push({
          id: entry.name,
          name: config.name ?? entry.name,
          description: config.description,
          version: config.version,
        })
      } catch {
        // No theme.json or invalid
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Theme discovery error:", err)
    }
  }
  return results.sort((a, b) => a.name.localeCompare(b.name))
}
