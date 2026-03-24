import { NextResponse } from 'next/server'
import { siteSettingsRepository } from '@/lib/repositories/siteSettingsRepository'
import { auth } from '@/lib/auth'
import { logUserActivity } from '@/lib/activityLog'
import type { Prisma } from '@prisma/client'

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { title, description } = await request.json()

    // Update or create settings
    const settings = await siteSettingsRepository.upsert({
      where: {
        id: (await siteSettingsRepository.findFirst({
          orderBy: { updatedAt: 'desc' }
        }))?.id || 'new'
      },
      update: {
        title,
        description,
        updatedBy: { connect: { id: session.user.id } }
      },
      create: {
        title,
        description,
        updatedBy: { connect: { id: session.user.id } }
      }
    })

    // Log the activity
    await logUserActivity({
      userId: session.user.id,
      action: 'settings_updated',
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        updatedFields: ['title', 'description'],
        settingsId: settings.id,
      },
    });

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await request.json()

    // Get the most recent settings record
    const settings = await siteSettingsRepository.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    // List of allowed fields for update
    const allowedFields = [
      'title',
      'description',
      'location',
      'latitude',
      'longitude',
      'aiKey',
      'analyticsSnippet',
      'easycronApiKey',
      'easycronEnabled',
      'easycronWebhookUrl'
    ]

    // Build update data from allowed fields
    const updateData: Record<string, unknown> = {
      updatedBy: { connect: { id: session.user.id } }
    }
    const updatedFields: string[] = []
    for (const key of allowedFields) {
      if (key in json) {
        updateData[key] = json[key]
        updatedFields.push(key)
      }
    }

    // If no allowed fields are present, return error
    if (Object.keys(updateData).length === 1) {
      return new NextResponse('No valid fields to update', { status: 400 })
    }

    let updatedSettings
    if (!settings) {
      const titleFromBody =
        typeof json.title === 'string' && json.title.trim() ? json.title.trim() : null
      const createData: Prisma.SiteSettingsCreateInput = {
        updatedBy: { connect: { id: session.user.id } },
        title: titleFromBody ?? 'My site',
      }
      for (const key of allowedFields) {
        if (key === 'title') continue
        if (key in json) {
          ;(createData as Record<string, unknown>)[key] = json[key]
        }
      }
      updatedSettings = await siteSettingsRepository.create(createData)
    } else {
      updatedSettings = await siteSettingsRepository.update(settings.id, updateData)
    }

    // Log the activity
    await logUserActivity({
      userId: session.user.id,
      action: 'settings_updated',
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        updatedFields,
        settingsId: updatedSettings.id,
      },
    })

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(request: Request) {
  return PUT(request)
}

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const settings = await siteSettingsRepository.findFirst({
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json(settings)
  } catch (error: Error | unknown) {
    console.error('Settings fetch error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 