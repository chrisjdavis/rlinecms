import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { projectRepository } from '@/lib/repositories/projectRepository'
import { logUserActivity } from '@/lib/activityLog'
import * as z from 'zod'

const projectSchema = z.object({
  title: z.string().min(1).max(255),
  url: z.union([z.string().url(), z.literal('')]).optional(),
  shortDescription: z.string().min(1).max(500),
  carouselOrder: z.number().int().min(0).default(0),
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
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('PUBLISHED'),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const [projects, total] = await Promise.all([
      projectRepository.findAll({
        orderBy: { carouselOrder: 'asc' },
        skip: offset,
        take: limit,
      }),
      projectRepository.count(),
    ])

    return NextResponse.json({
      projects: Array.isArray(projects) ? projects : [],
      total: typeof total === 'number' ? total : 0,
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = projectSchema.safeParse({
      ...body,
      heroImage: body.heroImage || null,
      icon: body.icon || null,
      url: body.url === '' ? undefined : body.url,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const project = await projectRepository.create({
      title: parsed.data.title,
      url: parsed.data.url || undefined,
      shortDescription: parsed.data.shortDescription,
      carouselOrder: parsed.data.carouselOrder,
      heroImage: parsed.data.heroImage || undefined,
      icon: parsed.data.icon || undefined,
      status: parsed.data.status,
    })

    await logUserActivity({
      userId: session.user.id,
      action: 'project_created',
      ip: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: { projectId: project.id, title: project.title },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
