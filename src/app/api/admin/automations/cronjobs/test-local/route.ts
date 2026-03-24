import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cronJobRepository } from '@/lib/repositories/cronJobRepository'
import { logger } from '@/lib/logger'

export async function POST() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testData = {
      name: 'Test Local Job',
      description: 'Testing local database operations',
      url: 'https://httpbin.org/get',
      frequency: 'every-5-minutes' as const
    };

    logger.info('Testing local cron job creation', { testData, userId: session.user.id });

    // Test 1: Create local job
    let cronJob;
    try {
      cronJob = await cronJobRepository.create(testData, session.user.id)
      logger.info('Local cron job created successfully', { jobId: cronJob.id });
    } catch (error) {
      logger.error('Failed to create local cron job', { 
        error: error instanceof Error ? error.message : error,
        testData,
        userId: session.user.id
      });
      return NextResponse.json({ 
        error: 'Failed to create local cron job',
        details: error instanceof Error ? error.message : error
      }, { status: 500 });
    }

    // Test 2: Update with EasyCron ID
    const testEasyCronId = 'test-easycron-123';
    try {
      await cronJobRepository.updateEasyCronJobId(cronJob.id, testEasyCronId)
      logger.info('EasyCron ID updated successfully', { jobId: cronJob.id, easycronId: testEasyCronId });
    } catch (error) {
      logger.error('Failed to update EasyCron ID', { 
        error: error instanceof Error ? error.message : error,
        jobId: cronJob.id,
        easycronId: testEasyCronId
      });
      return NextResponse.json({ 
        error: 'Failed to update EasyCron ID',
        details: error instanceof Error ? error.message : error
      }, { status: 500 });
    }

    // Test 3: Clean up - delete the test job
    try {
      await cronJobRepository.delete(cronJob.id)
      logger.info('Test job deleted successfully', { jobId: cronJob.id });
    } catch (error) {
      logger.error('Failed to delete test job', { 
        error: error instanceof Error ? error.message : error,
        jobId: cronJob.id
      });
      // Don't fail the test for cleanup errors
    }

    return NextResponse.json({ 
      success: true, 
      message: 'All local database operations completed successfully',
      jobId: cronJob.id
    })
  } catch (error) {
    logger.error('Test local cron job error', { 
      error: error instanceof Error ? error.message : error 
    });
    return NextResponse.json(
      { error: 'Failed to test local cron job operations' },
      { status: 500 }
    )
  }
} 