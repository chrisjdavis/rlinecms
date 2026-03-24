import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getActiveThemeMeta } from '@/lib/theme-loader'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ theme: string; file: string }> }
) {
  try {
    const { theme, file } = await params

    // Validate file path to prevent directory traversal
    if (file.includes('..') || file.includes('/')) {
      return new NextResponse('Invalid file path', { status: 400 })
    }

    const themeMeta = await getActiveThemeMeta()
    if (!themeMeta || themeMeta.id !== theme) {
      return new NextResponse('Theme not found', { status: 404 })
    }

    const filePath = path.join(process.cwd(), 'src/themes', themeMeta.themePath, 'assets', file)

    // Verify the file exists
    try {
      await fs.access(filePath)
    } catch {
      return new NextResponse('File not found', { status: 404 })
    }

    const fileContents = await fs.readFile(filePath)
    
    // Determine content type based on file extension
    const ext = path.extname(file).toLowerCase()
    const contentType = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
    }[ext] || 'application/octet-stream'

    return new NextResponse(fileContents, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })
  } catch (error) {
    console.error('Error serving theme file:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 