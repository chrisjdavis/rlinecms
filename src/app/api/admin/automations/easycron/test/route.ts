import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createEasyCronService } from '@/lib/services/easycronService'
import { logger } from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { apiKey } = await req.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    const easyCronService = createEasyCronService(apiKey)
    const isConnected = await easyCronService.testConnection()

    if (isConnected) {
      return NextResponse.json({ 
        success: true, 
        message: 'EasyCron connection successful' 
      })
    } else {
      return NextResponse.json({ 
        error: 'Invalid API key or connection failed' 
      }, { status: 400 })
    }
  } catch (error) {
    logger.error('EasyCron test error', { 
      error: error instanceof Error ? error.message : error 
    });
    return NextResponse.json(
      { error: 'Failed to test EasyCron connection' },
      { status: 500 }
    )
  }
} 