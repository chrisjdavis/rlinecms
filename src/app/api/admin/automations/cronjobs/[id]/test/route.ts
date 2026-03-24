import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cronJobRepository } from '@/lib/repositories/cronJobRepository'
import { cronJobExecutionRepository } from '@/lib/repositories/cronJobExecutionRepository'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const cronJob = await cronJobRepository.findById(id)

    if (!cronJob) {
      return NextResponse.json({ error: 'Cron job not found' }, { status: 404 })
    }

    // Create execution record
    const execution = await cronJobExecutionRepository.create({
      cronJobId: id,
      status: 'RUNNING'
    })

    const startTime = Date.now()

    try {
      // Make the HTTP request to the cron job URL
      const response = await fetch(cronJob.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SCHEDULER_SECRET_TOKEN}`
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      const responseText = await response.text()
      const duration = Date.now() - startTime

      // Update execution record
      await cronJobExecutionRepository.update(execution.id, {
        status: response.ok ? 'SUCCESS' : 'FAILED',
        completedAt: new Date(),
        duration,
        response: responseText,
        httpStatus: response.status
      })

      // Update last run time
      await cronJobRepository.updateLastRun(id, new Date())

      if (response.ok) {
        return NextResponse.json({ 
          success: true, 
          message: 'Cron job executed successfully',
          duration,
          httpStatus: response.status
        })
      } else {
        return NextResponse.json({ 
          error: `Cron job failed with status ${response.status}`,
          duration,
          httpStatus: response.status,
          response: responseText
        }, { status: 400 })
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Update execution record with error
      await cronJobExecutionRepository.update(execution.id, {
        status: 'FAILED',
        completedAt: new Date(),
        duration,
        error: error instanceof Error ? error.message : String(error)
      })

      throw error
    }
  } catch (error) {
    console.error('Error testing cron job:', error)
    return NextResponse.json(
      { error: 'Failed to test cron job' },
      { status: 500 }
    )
  }
} 