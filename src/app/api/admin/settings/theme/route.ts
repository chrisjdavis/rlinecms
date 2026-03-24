import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { themeRepository } from '@/lib/repositories/themeRepository'
import { getEnabledThemeIds } from "@/lib/themes/registry"
import { revalidatePath } from "next/cache"

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { themeId } = await request.json()
    if (!themeId) {
      return NextResponse.json({ error: "Theme ID is required" }, { status: 400 })
    }

    const theme = await themeRepository.findById(themeId)
    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 })
    }

    const enabledIds = await getEnabledThemeIds()
    if (enabledIds.length > 0 && !enabledIds.includes(theme.themePath)) {
      return NextResponse.json(
        {
          error:
            "Selected theme is not enabled for the public site. Enable it under Admin → Minimal theme.",
        },
        { status: 400 }
      )
    }

    // Deactivate all themes
    await themeRepository.updateMany({
      where: {
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // Activate the selected theme
    await themeRepository.update(themeId, { isActive: true })

    // Revalidate all pages since theme affects the entire site
    revalidatePath("/")
    revalidatePath("/admin")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating theme:", error)
    return NextResponse.json(
      { error: "Failed to update Minimal theme" },
      { status: 500 }
    )
  }
} 