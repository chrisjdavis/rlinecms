import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { discoverThemes } from "@/lib/themes/discovery"
import { siteSettingsRepository } from "@/lib/repositories/siteSettingsRepository"

/** GET: list discovered themes and current enabled IDs (admin only). */
export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const [themes, enabledIds] = await Promise.all([
      discoverThemes(),
      siteSettingsRepository.getEnabledThemes(),
    ])
    const ids = enabledIds ?? themes.map((t) => t.id)
    return NextResponse.json({
      themes: themes.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description ?? null,
        version: t.version ?? null,
      })),
      enabledIds: ids,
    })
  } catch (err) {
    console.error("GET /api/admin/themes:", err)
    return NextResponse.json(
      { error: "Failed to load Minimal theme settings" },
      { status: 500 }
    )
  }
}

/** PUT: set enabled theme IDs (admin only). Body: { enabledIds: string[] } */
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const body = await req.json()
    const enabledIds = Array.isArray(body.enabledIds)
      ? (body.enabledIds as string[]).filter((id: unknown) => typeof id === "string")
      : []

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

    await siteSettingsRepository.update(settings.id, { enabledThemes: enabledIds })
    return NextResponse.json({ enabledIds })
  } catch (err) {
    console.error("PUT /api/admin/themes:", err)
    return NextResponse.json(
      { error: "Failed to update Minimal theme settings" },
      { status: 500 }
    )
  }
}
