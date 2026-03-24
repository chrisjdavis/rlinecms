import { NextResponse } from 'next/server'
import { projectRepository } from '@/lib/repositories/projectRepository'

/**
 * Public API - returns published projects for homepage carousel.
 * No authentication required.
 */
export async function GET() {
  try {
    const projects = await projectRepository.findPublished()
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
