"use client"

import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ThemeOption {
  id: string
  name: string
  themePath: string
}

export function ThemeSelector() {
  const [themes, setThemes] = useState<ThemeOption[]>([])
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchThemes() {
      try {
        const res = await fetch("/api/themes")
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setThemes(data.themes ?? [])
          setActiveThemeId(data.activeThemeId ?? null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchThemes()
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = async (themeId: string) => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Could not update Minimal theme")
        return
      }
      setActiveThemeId(themeId)
      toast.success("Minimal theme updated")
    } catch {
      toast.error("Could not update Minimal theme")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Minimal theme (public site)</Label>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (themes.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Minimal theme (public site)</Label>
        <p className="text-sm text-muted-foreground">
          Minimal is not available yet. Enable it under Admin → Minimal theme, then return here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>Minimal theme (public site)</Label>
      <Select
        value={activeThemeId ?? ""}
        onValueChange={handleChange}
        disabled={saving}
      >
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Select Minimal" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              {theme.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Only the bundled Minimal theme appears here when it is enabled under Admin → Minimal theme.
      </p>
    </div>
  )
}
