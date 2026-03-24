"use client"

import { createContext, useContext, useState } from "react"
import { ThemeConfig } from "@/types/theme"

interface ThemeContextType {
  theme: ThemeConfig | null
  isLoading: boolean
  error: string | null
}

const ThemeContext = createContext<ThemeContextType>({
  theme: null,
  isLoading: false,
  error: null,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // No server-only code or async loading here
  const [theme] = useState<ThemeConfig | null>(null)
  const [isLoading] = useState(false)
  const [error] = useState<string | null>(null)

  // Optionally, you can add logic to fetch theme config from an API route here

  return (
    <ThemeContext.Provider value={{ theme, isLoading, error }}>
      {children}
    </ThemeContext.Provider>
  )
} 