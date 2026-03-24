import Link from 'next/link'
import type { Site } from '../contentTypes'
import './minimal.css'

interface LayoutProps {
  children: React.ReactNode
  site: Site
  navigation?: {
    header: { label: string; url: string }[]
    footer: { label: string; url: string }[]
  }
}

export function Layout({
  children,
  site,
  navigation = { header: [], footer: [] },
}: LayoutProps) {
  return (
    <div className="theme-minimal min-h-screen flex flex-col bg-[var(--minimal-bg)] text-[var(--minimal-fg)]">
      <header className="border-b border-[var(--minimal-border)] shrink-0">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-baseline sm:justify-between">
            <Link
              href="/"
              className="text-xl font-heading font-medium tracking-tight no-underline hover:opacity-70"
            >
              {site.title}
            </Link>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {navigation.header.map((item) => (
                <Link
                  key={item.url}
                  href={item.url}
                  className="text-[var(--minimal-muted)] no-underline hover:text-[var(--minimal-fg)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          {site.description && (
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--minimal-muted)] font-serif">
              {site.description}
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-14">{children}</main>

      <footer className="border-t border-[var(--minimal-border)] mt-auto shrink-0">
        <div className="mx-auto max-w-2xl px-6 py-10 text-sm text-[var(--minimal-muted)]">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
            {navigation.footer.map((item) => (
              <Link
                key={item.url}
                href={item.url}
                className="no-underline hover:text-[var(--minimal-fg)]"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/timeline" className="no-underline hover:text-[var(--minimal-fg)]">
              Timeline
            </Link>
          </nav>
          <p className="font-serif">
            © {new Date().getFullYear()} {site.title}
          </p>
        </div>
      </footer>
    </div>
  )
}
