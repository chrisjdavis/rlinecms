"use client"

import { useMemo, useState, useCallback } from "react"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

let cachedIconNames: string[] | null = null

function getLucideIconNames(): string[] {
  if (cachedIconNames) return cachedIconNames
  cachedIconNames = Object.keys(LucideIcons).filter(
    (k) =>
      /^[A-Z][a-zA-Z0-9]*$/.test(k) &&
      k !== "Icon" &&
      !k.endsWith("Icon") &&
      !k.startsWith("Lucide")
  )
  cachedIconNames.sort((a, b) => a.localeCompare(b))
  return cachedIconNames
}

function getLucideIconExport(name: string): LucideIcon | null {
  const mod = LucideIcons as Record<string, unknown>
  const Icon = mod[name]
  if (Icon && typeof Icon === "object") {
    return Icon as LucideIcon
  }
  return null
}

/** Map stored keys (e.g. hexagon, chevron-right) to a Lucide export name for preview. */
function keyToPascalCase(key: string): string {
  return key
    .trim()
    .split(/[-_\s.]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join("")
}

export function resolveLucideIcon(key: string): LucideIcon | null {
  const trimmed = key.trim()
  if (!trimmed) return null
  return getLucideIconExport(trimmed) || getLucideIconExport(keyToPascalCase(trimmed))
}

const MAX_RESULTS = 120

function splitCamel(s: string): string {
  return s.replace(/([a-z])([A-Z0-9])/g, "$1 $2").toLowerCase()
}

function scoreIconName(name: string, q: string): number {
  const qn = q.trim().toLowerCase()
  if (!qn) return 1
  const lower = name.toLowerCase()
  const words = splitCamel(name)
  if (lower === qn) return 100
  if (lower.startsWith(qn)) return 85
  if (words.startsWith(qn)) return 82
  if (lower.includes(qn)) return 65
  if (words.includes(qn)) return 55
  const qParts = qn.split(/\s+/).filter(Boolean)
  if (qParts.length > 1 && qParts.every((p) => words.includes(p))) return 50
  return 0
}

function searchIconNames(query: string): string[] {
  const all = getLucideIconNames()
  const q = query.trim()
  if (!q) {
    return all.slice(0, MAX_RESULTS)
  }
  return all
    .map((name) => ({ name, score: scoreIconName(name, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, MAX_RESULTS)
    .map((x) => x.name)
}

export interface LucideIconPickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  className?: string
  /** Narrow layout for feature rows (smaller trigger, shared dialog). */
  compact?: boolean
}

export function LucideIconPicker({
  value,
  onChange,
  disabled,
  id,
  className,
  compact,
}: LucideIconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    if (!open) return []
    return searchIconNames(query)
  }, [open, query])

  const Preview = value ? resolveLucideIcon(value) : null

  const handlePick = useCallback(
    (name: string) => {
      onChange(name)
      setOpen(false)
      setQuery("")
    },
    [onChange]
  )

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      {Preview ? (
        <Preview className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-dashed bg-muted/50" />
      )}
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Hexagon, Sparkles…"
        disabled={disabled}
        className={cn("min-w-0 font-mono text-sm", compact ? "flex-1" : "flex-1")}
        autoComplete="off"
      />
      <Button
        type="button"
        variant="outline"
        size={compact ? "icon" : "sm"}
        className={cn("shrink-0", !compact && "gap-1.5")}
        disabled={disabled}
        onClick={() => {
          setQuery("")
          setOpen(true)
        }}
        aria-label="Search Lucide icons"
      >
        <LucideIcons.Search className="h-4 w-4" />
        {!compact && <span className="hidden sm:inline">Browse</span>}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery("")
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-4 p-0">
          <DialogHeader className="space-y-1.5 px-6 pt-6">
            <DialogTitle>Lucide icons</DialogTitle>
            <DialogDescription>
              Search by icon name (PascalCase as stored, e.g. Shield, Sparkles). Choosing one fills the field with
              that export name for use with lucide-react.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6">
            <Input
              placeholder="Type to filter…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="font-mono text-sm"
              autoFocus
            />
          </div>
          <div className="min-h-[220px] flex-1 overflow-y-auto border-t px-4 py-3">
            {results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No icons match that search.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {results.map((name) => {
                  const Icon = getLucideIconExport(name)
                  if (!Icon) return null
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handlePick(name)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-md border border-transparent p-2 text-center transition-colors",
                        "hover:border-border hover:bg-muted/80",
                        value === name && "border-primary bg-muted"
                      )}
                    >
                      <Icon className="h-6 w-6 shrink-0" />
                      <span className="w-full truncate font-mono text-[10px] leading-tight text-muted-foreground">
                        {name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <p className="border-t px-6 py-3 text-xs text-muted-foreground">
            Showing up to {MAX_RESULTS} results. Refine your search if you do not see the icon you need.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
