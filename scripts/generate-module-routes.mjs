/**
 * Build-time script: scan src/modules for module.json and write aggregated
 * publicApiPaths and adminPaths to src/lib/modules/route-paths.generated.json
 * for use in middleware (edge can't read DB or fs).
 */
import fs from "fs"
import path from "path"

const MODULES_DIR = path.join(process.cwd(), "src", "modules")
const OUT_PATH = path.join(process.cwd(), "src", "lib", "modules", "route-paths.generated.json")

const publicApiPaths = []
const adminPaths = []

try {
  const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const manifestPath = path.join(MODULES_DIR, entry.name, "module.json")
    try {
      const content = fs.readFileSync(manifestPath, "utf-8")
      const manifest = JSON.parse(content)
      if (manifest.publicApiPaths && Array.isArray(manifest.publicApiPaths)) {
        publicApiPaths.push(...manifest.publicApiPaths)
      }
      if (manifest.adminPaths && Array.isArray(manifest.adminPaths)) {
        adminPaths.push(...manifest.adminPaths)
      }
    } catch {
      // No manifest or invalid - skip
    }
  }
} catch (err) {
  if (err.code !== "ENOENT") {
    console.error("generate-module-routes:", err.message)
  }
}

const output = {
  publicApiPaths: [...new Set(publicApiPaths)],
  adminPaths: [...new Set(adminPaths)],
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf-8")
console.log("Generated", OUT_PATH)
