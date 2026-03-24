import { themeRepository } from '@/lib/repositories/themeRepository'
import path from 'path'
import { ThemeConfig } from "@/types/theme"
import { promises as fs } from "fs"
import { getThemeComponent, ThemeComponent, ThemeTemplate } from './theme-registry'
import { getEnabledThemeIds } from '@/lib/themes/registry'

/** Get the active theme's metadata from the DB. Only returns a theme that is enabled. Returns null when no theme is active. */
export async function getActiveThemeMeta() {
  const [activeTheme, enabledIds] = await Promise.all([
    themeRepository.findFirst({ where: { isActive: true } }),
    getEnabledThemeIds(),
  ])
  if (activeTheme && enabledIds.includes(activeTheme.themePath)) {
    return activeTheme
  }
  if (enabledIds.length === 0) return null
  const fallback = await themeRepository.findFirst({
    where: { themePath: { in: enabledIds } },
  })
  return fallback ?? null
}

/**
 * Dynamically import a component from the active theme.
 * Returns the component or null if not found.
 */
export async function getActiveThemeComponent(template: 'Index' | 'Post' | 'Page'): Promise<ThemeComponent | null> {
  try {
    const theme = await getActiveThemeMeta()
    if (!theme) return null
    const themePath = path.join(process.cwd(), 'src/components/theme', theme.themePath)
    const { default: Component } = await getThemeComponent(themePath, template)
    return Component
  } catch (err) {
    console.error('Failed to load theme component:', err)
    return null
  }
}

/**
 * Get the public asset path for a file in the active theme.
 */
export function getThemeAssetPath(themeMeta: { themePath: string }, asset: string) {
  const themeName = path.basename(themeMeta.themePath)
  return `/src/themes/${themeName}/assets/${asset}`
}

export interface ThemeLoaderOptions {
  themePath: string
  themeId: string
}

export interface LoadedTheme {
  config: ThemeConfig
  components: Record<string, ThemeComponent>
  assets: Record<string, string>
}

export class ThemeLoader {
  private themePath: string
  private themeId: string

  constructor(options: ThemeLoaderOptions) {
    this.themePath = options.themePath
    this.themeId = options.themeId
  }

  async loadConfig(): Promise<ThemeConfig> {
    const configPath = path.join(this.themePath, "theme.json")
    const configContent = await fs.readFile(configPath, "utf-8")
    return JSON.parse(configContent) as ThemeConfig
  }

  async loadComponents(): Promise<Record<string, ThemeComponent>> {
    const components: Record<string, ThemeComponent> = {}

    try {
      const templates: ThemeTemplate[] = ['Index', 'Post', 'Page']
      
      for (const template of templates) {
        try {
          const { default: Component } = await getThemeComponent(this.themePath, template)
          components[template] = Component
        } catch (error) {
          console.error(`Error loading ${template} component:`, error)
        }
      }
    } catch (error) {
      console.error(`Error loading components: ${error instanceof Error ? error.message : String(error)}`)
    }

    return components
  }

  async loadAssets(): Promise<Record<string, string>> {
    const assetsPath = path.join(this.themePath, "assets")
    const assets: Record<string, string> = {}

    try {
      const files = await fs.readdir(assetsPath, { recursive: true })
      for (const file of files) {
        const assetPath = path.join("/themes", this.themeId, "assets", file)
        assets[file] = assetPath
      }
    } catch (error) {
      console.error(`Error loading assets: ${error instanceof Error ? error.message : String(error)}`)
    }

    return assets
  }

  async load(): Promise<LoadedTheme> {
    const [config, components, assets] = await Promise.all([
      this.loadConfig(),
      this.loadComponents(),
      this.loadAssets()
    ])

    return {
      config,
      components,
      assets
    }
  }
}
