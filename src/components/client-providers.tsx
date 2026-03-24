"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"

interface Props {
  children: ReactNode
}

export function ClientProviders({ children }: Props) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <Toaster position="top-right" />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
} 