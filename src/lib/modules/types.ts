/**
 * Module system types for Ridgeline CMS.
 * Modules are discovered from src/modules (each dir with a module.json) and enabled via Settings.
 */

/** Permission required to see the nav item (matches auth role). */
export type ModulePermission = "ADMIN" | "USER" | "COMMENTER"

/** Nav entry for the admin sidebar (icon is Lucide icon name string). */
export interface ModuleNavEntry {
  label: string
  href: string
  icon: string
  permission?: ModulePermission
}

/** Manifest file (module.json) in a module directory. */
export interface ModuleManifest {
  id: string
  name: string
  description?: string
  version?: string
  nav?: ModuleNavEntry
  /** Public API path prefixes (e.g. ["/api/v1/updates"]) for middleware. */
  publicApiPaths?: string[]
  /** Admin path prefixes (e.g. ["/admin/updates"]) for middleware. */
  adminPaths?: string[]
}

/** Resolved descriptor after loading manifest from disk. */
export interface ModuleDescriptor {
  id: string
  name: string
  description?: string
  version?: string
  nav: ModuleNavEntry | null
  publicApiPaths: string[]
  adminPaths: string[]
  /** Directory name / path segment where the module lives (e.g. "updates"). */
  pathSegment: string
}

/** Nav item passed to admin layout (icon as string for client-side mapping). */
export interface ModuleNavItem {
  name: string
  href: string
  icon: string
  permission?: ModulePermission
}
