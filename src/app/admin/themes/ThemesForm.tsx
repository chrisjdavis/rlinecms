"use client"

import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { section } from "@/components/theme/admin"
import { toast } from "sonner"

interface ThemeInfo {
  id: string
  name: string
  description: string | null
  version: string | null
}

export function ThemesForm() {
  const [themes, setThemes] = useState<ThemeInfo[]>([])
  const [enabledIds, setEnabledIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchThemes() {
      try {
        const res = await fetch("/api/admin/themes")
        if (!res.ok) throw new Error("Failed to load Minimal theme")
        const data = await res.json()
        if (!cancelled) {
          setThemes(data.themes ?? [])
          setEnabledIds(data.enabledIds ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          toast.error("Failed to load Minimal theme")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchThemes()
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggle = async (themeId: string, enabled: boolean) => {
    const next = enabled
      ? [...enabledIds, themeId]
      : enabledIds.filter((id) => id !== themeId)
    setEnabledIds(next)
    setSaving(true)
    try {
      const res = await fetch("/api/admin/themes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabledIds: next }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Saved")
    } catch {
      setEnabledIds(enabledIds)
      toast.error("Failed to update Minimal theme")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={section({ spacing: "lg" })}>
        <p className="text-muted-foreground">Loading Minimal theme…</p>
      </div>
    )
  }

  return (
    <div className={section({ spacing: "lg" })}>
      <p className="text-muted-foreground mb-4">
        RLine ships with the <strong>Minimal</strong> theme only. Enable or disable it for the public site; when enabled, you can set it as the active theme under Settings → Site.
      </p>
      <ul className="space-y-4">
        {themes.length === 0 ? (
          <li className="text-muted-foreground">
            Minimal theme not found. It should live in{' '}
            <code className="text-sm">src/components/theme/minimal</code>.
          </li>
        ) : (
          themes.map((theme) => (
            <li
              key={theme.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <div className="font-medium">{theme.name}</div>
                {theme.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {theme.description}
                  </div>
                )}
                {theme.version && (
                  <div className="text-xs text-muted-foreground mt-1">
                    v{theme.version}
                  </div>
                )}
              </div>
              <Switch
                id={`theme-${theme.id}`}
                checked={enabledIds.includes(theme.id)}
                onCheckedChange={(checked) => handleToggle(theme.id, checked)}
                disabled={saving}
              />
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
