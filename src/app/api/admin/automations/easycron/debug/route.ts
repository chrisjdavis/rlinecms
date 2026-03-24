import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
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

    // Make a simple raw API call to test connectivity
    const url = 'https://api.easycron.com/v1/cron-jobs';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    };

    logger.info('Making raw EasyCron API call', { url, hasApiKey: !!apiKey });

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    logger.info('Raw EasyCron API response', { 
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    const responseText = await response.text();
    const responseData = JSON.parse(responseText);

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseData,
      responseText,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error) {
    logger.error('EasyCron debug API error', { 
      error: error instanceof Error ? error.message : error 
    });
    return NextResponse.json(
      { error: 'Failed to debug EasyCron API' },
      { status: 500 }
    )
  }
} 