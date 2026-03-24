"use client"

import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { section } from "@/components/theme/admin"
import { toast } from "sonner"

interface ModuleInfo {
  id: string
  name: string
  description: string | null
  version: string | null
}

export function ModulesForm() {
  const [modules, setModules] = useState<ModuleInfo[]>([])
  const [enabledIds, setEnabledIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchModules() {
      try {
        const res = await fetch("/api/admin/modules")
        if (!res.ok) throw new Error("Failed to load extensions")
        const data = await res.json()
        if (!cancelled) {
          setModules(data.modules ?? [])
          setEnabledIds(data.enabledIds ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          toast.error("Failed to load extensions")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchModules()
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggle = async (moduleId: string, enabled: boolean) => {
    const next = enabled
      ? [...enabledIds, moduleId]
      : enabledIds.filter((id) => id !== moduleId)
    setEnabledIds(next)
    setSaving(true)
    try {
      const res = await fetch("/api/admin/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabledIds: next }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(enabled ? "Extension enabled" : "Extension disabled")
    } catch {
      setEnabledIds(enabledIds)
      toast.error("Failed to update extensions")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={section({ spacing: "lg" })}>
        <p className="text-muted-foreground">Loading extensions...</p>
      </div>
    )
  }

  return (
    <div className={section({ spacing: "lg" })}>
      <p className="text-muted-foreground mb-4">
        Enable or disable extensions. Disabled extensions are hidden from the admin menu and their routes may be restricted.
      </p>
      <ul className="space-y-4">
        {modules.length === 0 ? (
          <li className="text-muted-foreground">No extensions found. Add extensions in <code className="text-sm">src/modules</code>.</li>
        ) : (
          modules.map((mod) => (
            <li
              key={mod.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <div className="font-medium">{mod.name}</div>
                {mod.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {mod.description}
                  </div>
                )}
                {mod.version && (
                  <div className="text-xs text-muted-foreground mt-1">
                    v{mod.version}
                  </div>
                )}
              </div>
              <Switch
                id={`module-${mod.id}`}
                checked={enabledIds.includes(mod.id)}
                onCheckedChange={(checked) => handleToggle(mod.id, checked)}
                disabled={saving}
              />
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
