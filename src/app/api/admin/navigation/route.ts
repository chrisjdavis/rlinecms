import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const navigationItems = await prisma.navigationItem.findMany({
      orderBy: [
        { location: 'asc' },
        { order: 'asc' }
      ]
    })

    return NextResponse.json(navigationItems)
  } catch (error) {
    console.error('Error fetching navigation:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const items = await request.json()

    // Get the most recent settings record
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (!settings) {
      return new NextResponse('Settings not found', { status: 404 })
    }

    // Delete all existing navigation items
    await prisma.navigationItem.deleteMany({
      where: { settingsId: settings.id }
    })

    // Create new navigation items
    await prisma.navigationItem.createMany({
      data: items.map((item: { label: string; url: string; order: number; location: string }) => ({
        label: item.label,
        url: item.url,
        order: item.order,
        location: item.location,
        settingsId: settings.id
      }))
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating navigation:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 