import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { discoverModules, getEnabledModuleIds } from "@/lib/modules/registry"
import { siteSettingsRepository } from "@/lib/repositories/siteSettingsRepository"

/** GET: list discovered modules and current enabled IDs (admin only). */
export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const [modules, enabledIds] = await Promise.all([
      discoverModules(),
      getEnabledModuleIds(),
    ])
    return NextResponse.json({
      modules: modules.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description ?? null,
        version: m.version ?? null,
      })),
      enabledIds,
    })
  } catch (err) {
    console.error("GET /api/admin/modules:", err)
    return NextResponse.json({ error: "Failed to load modules" }, { status: 500 })
  }
}

/** PUT: set enabled module IDs (admin only). Body: { enabledIds: string[] } */
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const body = await req.json()
    const enabledIds = Array.isArray(body.enabledIds)
      ? (body.enabledIds as string[]).filter((id) => typeof id === "string")
      : []

    // Ensure a site settings record exists so we can persist enabledModules
    let settings = await siteSettingsRepository.findFirst({
      orderBy: { updatedAt: "desc" },
    })
    if (!settings) {
      settings = await siteSettingsRepository.create({
        title: "Site",
        description: null,
        updatedBy: { connect: { id: session.user.id } },
      })
    }

    await siteSettingsRepository.update(settings.id, { enabledModules: enabledIds })
    return NextResponse.json({ enabledIds })
  } catch (err) {
    console.error("PUT /api/admin/modules:", err)
    return NextResponse.json({ error: "Failed to update modules" }, { status: 500 })
  }
}
