import { ThemeConfig } from "@/types/theme"

// Types and client-safe functions only
export interface ThemeFile {
  name: string
  content: string
  path: string
}

export interface ThemeAsset {
  name: string
  path: string
  type: "image" | "font" | "other"
}

export interface ThemeComponent {
  name: string
  content: string
  path: string
}

export interface Theme {
  id: string
  name: string
  description: string
  version: string
  files: ThemeFile[]
  assets: ThemeAsset[]
  components: ThemeComponent[]
  config: ThemeConfig
}

export interface ThemeMetadata {
  id: string
  name: string
  description: string
  version: string
  preview?: string
}

// Client-safe functions
interface ThemeListItem {
  name: string
}

export async function listThemes(): Promise<string[]> {
  try {
    const response = await fetch('/api/themes')
    if (!response.ok) return []
    const data = await response.json() as { themes?: ThemeListItem[] } | ThemeListItem[]
    const themes = Array.isArray(data) ? data : (data.themes ?? [])
    return themes.map((theme: ThemeListItem) => theme.name)
  } catch (error) {
    console.error('Error listing themes:', error)
    return []
  }
}

export async function getThemePath(themeName: string): Promise<string> {
  return `/themes/${themeName}`
}

export async function deleteTheme(themePath: string) {
  try {
    const response = await fetch(`/api/themes/${themePath.split('/').pop()}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete theme')
  } catch (error) {
    console.error('Error deleting theme:', error)
    throw error
  }
}

export async function writeThemeTemplate(themePath: string, templateName: string, content: string) {
  try {
    const response = await fetch('/api/themes/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        themePath,
        templateName,
        content,
      }),
    })
    if (!response.ok) throw new Error('Failed to write template')
  } catch (error) {
    console.error(`Error writing template ${templateName}:`, error)
    throw error
  }
}

export async function writeThemeStyles(themePath: string, styles: string) {
  try {
    const response = await fetch('/api/themes/styles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        themePath,
        styles,
      }),
    })
    if (!response.ok) throw new Error('Failed to write styles')
  } catch (error) {
    console.error('Error writing theme styles:', error)
    throw error
  }
}

export async function writeThemeConfig(themePath: string, config: ThemeConfig): Promise<void> {
  try {
    const response = await fetch('/api/themes/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        themePath,
        config,
      }),
    })
    if (!response.ok) throw new Error('Failed to write config')
  } catch (error) {
    console.error('Error writing theme config:', error)
    throw error
  }
}

export async function createThemeDirectory(themePath: string): Promise<void> {
  try {
    const response = await fetch('/api/themes/directory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        themePath,
      }),
    })
    if (!response.ok) throw new Error('Failed to create theme directory')
  } catch (error) {
    console.error('Error creating theme directory:', error)
    throw error
  }
}

// Server-only functions (throw if called in browser)
export async function readThemeConfig() {
  throw new Error('readThemeConfig is only available on the server. Import from theme-files.server.ts')
}
export async function readThemeTemplate() {
  throw new Error('readThemeTemplate is only available on the server. Import from theme-files.server.ts')
}
export async function readThemeStyles() {
  throw new Error('readThemeStyles is only available on the server. Import from theme-files.server.ts')
} 