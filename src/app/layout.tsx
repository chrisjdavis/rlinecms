import './globals.css'
import type { CSSProperties } from 'react'
import { Metadata } from 'next'
import { DM_Sans, Newsreader } from 'next/font/google'
import { ClientProviders } from "@/components/client-providers"
import { getSiteConfig } from '@/lib/site'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  return {
    title: {
      default: site.title,
      template: `%s`
    },
    description: site.description,
    alternates: {
      types: {
        'application/rss+xml': `${baseUrl}/feed.xml`,
      },
    },
    icons: [
      { rel: 'icon', url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { rel: 'apple-touch-icon', url: '/apple-touch-icon.png', sizes: '180x180' },
      { rel: 'manifest', url: '/site.webmanifest' }
    ],
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${newsreader.variable}`}
      style={
        {
          '--font-heading': 'var(--font-sans)',
        } as CSSProperties
      }
    >
      <body className="min-h-screen font-sans antialiased">
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
