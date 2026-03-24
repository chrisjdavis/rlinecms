# Extensions (modules)

Optional features live here as **one folder per extension**, each with a `module.json` manifest.

## Adding an extension

1. Create `src/modules/<your-extension>/module.json` (see `src/lib/modules/types.ts` for `ModuleManifest`).
2. Implement admin pages, API routes, and repositories as needed.
3. List `adminPaths` and `publicApiPaths` in the manifest so auth middleware allows those routes (see `scripts/generate-module-routes.mjs`).
4. Run `npm run generate:module-routes` (also runs as part of `npm run build`).
5. Enable the extension under **Admin → Extensions**.

The core app does not ship any bundled extensions; the folder may be empty in a fresh clone.
