import path from 'path'
import fs from 'fs/promises'
import { extract } from 'zip-lib'
import { ThemeConfig } from "@/types/theme"

const THEMES_DIR = path.join(process.cwd(), 'src', 'themes')

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

export async function extractThemeZip(zipPath: string, themeName: string): Promise<string> {
  const themeDir = path.join(THEMES_DIR, themeName)
  await fs.mkdir(themeDir, { recursive: true })
  await extract(zipPath, themeDir)
  return themeDir
}

export async function readThemeConfig(themePath: string) {
  try {
    const configPath = path.join(themePath, 'theme.json')
    const content = await fs.readFile(configPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error reading theme config:', error)
    return null
  }
}

export async function readThemeTemplate(themePath: string, templateName: string) {
  try {
    const templatePath = path.join(themePath, 'templates', `${templateName}.tsx`)
    return await fs.readFile(templatePath, 'utf-8')
  } catch (error) {
    console.error(`Error reading template ${templateName}:`, error)
    return ''
  }
}

export async function readThemeStyles(themePath: string) {
  try {
    const stylesPath = path.join(themePath, 'styles.css')
    return await fs.readFile(stylesPath, 'utf-8')
  } catch (error) {
    console.error('Error reading theme styles:', error)
    return ''
  }
}

export async function writeThemeTemplate(themePath: string, templateName: string, content: string) {
  try {
    const templatePath = path.join(themePath, 'templates', `${templateName}.tsx`)
    await fs.writeFile(templatePath, content)
  } catch (error) {
    console.error(`Error writing template ${templateName}:`, error)
    throw error
  }
}

export async function writeThemeStyles(themePath: string, styles: string) {
  try {
    const stylesPath = path.join(themePath, 'styles.css')
    await fs.writeFile(stylesPath, styles)
  } catch (error) {
    console.error('Error writing theme styles:', error)
    throw error
  }
}

export async function writeThemeConfig(themePath: string, config: ThemeConfig): Promise<void> {
  const configPath = path.join(themePath, 'theme.json')
  await fs.writeFile(configPath, JSON.stringify(config, null, 2))
}

export async function createThemeDirectory(themePath: string): Promise<void> {
  await fs.mkdir(themePath, { recursive: true })
  await fs.mkdir(path.join(themePath, 'templates'), { recursive: true })
}

export async function getThemeMetadata(themeId: string): Promise<ThemeMetadata | null> {
  try {
    const themePath = path.join(process.cwd(), "public/themes", themeId)
    const configPath = path.join(themePath, "theme.json")
    const configContent = await fs.readFile(configPath, "utf-8")
    const config = JSON.parse(configContent) as ThemeMetadata
    return config
  } catch (error) {
    console.error(`Error reading theme metadata: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
} 