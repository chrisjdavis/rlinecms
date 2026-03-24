import { themeRepository } from '@/lib/repositories/themeRepository'
import { ThemeConfig } from "@/types/theme"
import path from "path"
import { readThemeConfig, readThemeStyles, readThemeTemplate } from "@/lib/theme-files.server"

export const defaultThemeConfig: ThemeConfig = {
  colors: {
    primary: "#000000",
    secondary: "#666666",
    background: "#ffffff",
    foreground: "#000000",
    muted: "#f1f1f1",
    text: "#000000",
    accent: "#ff0000",
    primaryForeground: "#ffffff",
    secondaryForeground: "#ffffff",
    mutedForeground: "#666666",
    border: "#e2e2e2"
  },
  typography: {
    fontFamily: "system-ui, sans-serif",
    fontSize: "16px",
    lineHeight: "1.5",
    headingFont: "system-ui, sans-serif",
    bodyFont: "system-ui, sans-serif",
    monoFont: "monospace"
  },
  spacing: {
    small: "8px",
    medium: "16px",
    large: "24px",
    base: 1,
    scale: 1.2
  },
  components: {
    article: {
      paragraph: {
        marginTop: "1rem",
        marginBottom: "1rem"
      }
    }
  },
  borderRadius: {
    small: "4px",
    medium: "8px",
    large: "12px"
  },
  container: {
    maxWidth: "1200px",
    padding: "16px"
  },
  styles: {
    prose: {
      p: {
        marginTop: "10px",
        marginBottom: "10px"
      }
    }
  },
  templates: {
    index: { content: "index template", name: "index" },
    post: { content: "post template", name: "post" },
    page: { content: "page template", name: "page" }
  }
}

export async function getActiveTheme() {
  const theme = await themeRepository.findFirst({
    where: {
      isActive: true
    },
  })

  if (!theme) {
    return null
  }

  // Read theme files from the filesystem
  const themePath = path.join(process.cwd(), "src", "components", "theme", theme.themePath)
  const config = await readThemeConfig(themePath)
  const styles = await readThemeStyles(themePath)
  const templates = {
    index: await readThemeTemplate(themePath, "index"),
    post: await readThemeTemplate(themePath, "post"),
    page: await readThemeTemplate(themePath, "page"),
  }

  return {
    ...theme,
    config,
    styles,
    templates,
  }
}

export async function setActiveTheme(themeId: string) {
  const theme = await themeRepository.findById(themeId)

  if (!theme) {
    throw new Error("Theme not found")
  }

  // Deactivate all themes
  await themeRepository.updateMany({
    where: {
      isActive: true,
    },
    data: {
      isActive: false,
    },
  })

  // Activate the selected theme
  return themeRepository.update(themeId, { isActive: true })
}

export function generateThemeCSS(config: ThemeConfig): string {
  return `
    :root {
      /* Colors */
      --color-background: ${config.colors.background};
      --color-foreground: ${config.colors.foreground};
      --color-primary: ${config.colors.primary};
      --color-primary-foreground: ${config.colors.primaryForeground};
      --color-secondary: ${config.colors.secondary};
      --color-secondary-foreground: ${config.colors.secondaryForeground};
      --color-muted: ${config.colors.muted};
      --color-muted-foreground: ${config.colors.mutedForeground};
      --color-border: ${config.colors.border};

      /* Typography */
      --font-heading: ${config.typography.headingFont};
      --font-body: ${config.typography.bodyFont};
      --font-mono: ${config.typography.monoFont};

      /* Spacing */
      --space-1: ${config.spacing.base}rem;
      --space-2: ${config.spacing.base * config.spacing.scale}rem;
      --space-3: ${config.spacing.base * Math.pow(config.spacing.scale, 2)}rem;
      --space-4: ${config.spacing.base * Math.pow(config.spacing.scale, 3)}rem;
      --space-6: ${config.spacing.base * Math.pow(config.spacing.scale, 4)}rem;
      --space-8: ${config.spacing.base * Math.pow(config.spacing.scale, 5)}rem;
      --space-12: ${config.spacing.base * Math.pow(config.spacing.scale, 6)}rem;
      --space-16: ${config.spacing.base * Math.pow(config.spacing.scale, 7)}rem;

      /* Border Radius */
      --radius-small: ${config.borderRadius.small};
      --radius-medium: ${config.borderRadius.medium};
      --radius-large: ${config.borderRadius.large};

      /* Container */
      --container-max-width: ${config.container.maxWidth};
      --container-padding: ${config.container.padding};
    }
  `
} 