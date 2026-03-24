import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { revalidateTag, revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { tag, path } = await request.json()
    if (!tag && !path) {
      return NextResponse.json({ error: 'Tag or path is required' }, { status: 400 })
    }

    if (tag) {
      revalidateTag(tag)
    }
    if (path) {
      revalidatePath(path)
    }

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error('[REVALIDATE]', error)
    return NextResponse.json({ error: 'Error revalidating' }, { status: 500 })
  }
} 