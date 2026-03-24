import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { projectRepository } from '@/lib/repositories/projectRepository'
import { logUserActivity } from '@/lib/activityLog'
import * as z from 'zod'

const projectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  url: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  shortDescription: z.string().min(1).max(500).optional(),
  carouselOrder: z.number().int().min(0).optional(),
  heroImage: z
    .string()
    .refine((val) => !val || val.startsWith('/') || val.startsWith('http'), {
      message: 'Must be a URL or path starting with /',
    })
    .optional()
    .nullable()
    .or(z.literal('')),
  icon: z
    .string()
    .refine((val) => !val || val.startsWith('/') || val.startsWith('http'), {
      message: 'Must be a URL or path starting with /',
    })
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const project = await projectRepository.findById(id)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = projectSchema.safeParse({
      ...body,
      heroImage: body.heroImage === '' ? null : body.heroImage,
      icon: body.icon === '' ? null : body.icon,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.url !== undefined) updateData.url = parsed.data.url || null
    if (parsed.data.shortDescription !== undefined)
      updateData.shortDescription = parsed.data.shortDescription
    if (parsed.data.carouselOrder !== undefined)
      updateData.carouselOrder = parsed.data.carouselOrder
    if (parsed.data.heroImage !== undefined)
      updateData.heroImage = parsed.data.heroImage || null
    if (parsed.data.icon !== undefined)
      updateData.icon = parsed.data.icon || null
    if (parsed.data.status !== undefined)
      updateData.status = parsed.data.status

    const project = await projectRepository.update(id, updateData)

    await logUserActivity({
      userId: session.user.id,
      action: 'project_updated',
      ip: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: { projectId: project.id, title: project.title },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await projectRepository.delete(id)

    await logUserActivity({
      userId: session.user.id,
      action: 'project_deleted',
      ip: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: { projectId: id },
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
