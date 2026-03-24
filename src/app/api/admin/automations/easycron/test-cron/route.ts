import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createEasyCronService } from '@/lib/services/easycronService'
import { logger } from '@/lib/logger'
import { getCronExpression } from '@/lib/constants/cronFrequencies'

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
    
    // First, let's test the basic API by listing existing jobs
    let apiTestResult: { success: boolean; error: string | null; jobs: unknown[] } = { success: false, error: null, jobs: [] };
    try {
      const existingJobs = await easyCronService.listJobs()
      apiTestResult = { success: true, error: null, jobs: existingJobs };
      logger.info('API test successful - existing EasyCron jobs', { count: existingJobs.length });
    } catch (error) {
      apiTestResult = { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        jobs: []
      };
      logger.error('API test failed - could not list existing jobs', { 
        error: error instanceof Error ? error.message : error 
      });
      return NextResponse.json({ 
        success: false, 
        apiTest: apiTestResult,
        message: 'Basic API connectivity test failed - check API key and network connection' 
      });
    }
    
    // Test only 5-field cron expressions
    const testCases = [
      { 
        name: 'Every Hour', 
        frequency: 'every-hour' as const, 
        expected: '0 * * * *',
        formats: ['0 * * * *']
      },
      { 
        name: 'Every 5 Minutes', 
        frequency: 'every-5-minutes' as const, 
        expected: '*/5 * * * *',
        formats: ['*/5 * * * *']
      },
      { 
        name: 'Daily at Midnight', 
        frequency: 'daily-midnight' as const, 
        expected: '0 0 * * *',
        formats: ['0 0 * * *']
      },
      { 
        name: 'Every 2 Hours', 
        frequency: 'every-2-hours' as const, 
        expected: '0 */2 * * *',
        formats: ['0 */2 * * *']
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      let success = false;
      let lastError: string | null = null;
      
      // Try each format for this test case
      for (const cronFormat of testCase.formats) {
        try {
          logger.info('Testing cron expression format', {
            name: testCase.name,
            frequency: testCase.frequency,
            cronFormat
          });

          // Create a test job
          const testJob = await easyCronService.createJob({
            name: `Test - ${testCase.name} (${cronFormat})`,
            url: 'https://httpbin.org/get',
            cron: cronFormat,
            enabled: false // Disabled for testing
          });

          // Get the job details to see how EasyCron interpreted it
          const jobDetails = await easyCronService.getJobDetails(testJob.id);
          
          logger.info('Job details retrieved', { 
            jobId: testJob.id, 
            jobDetails 
          });
          
          results.push({
            name: testCase.name,
            frequency: testCase.frequency,
            originalCron: getCronExpression(testCase.frequency),
            easyCronExpression: cronFormat,
            easyCronInterpreted: jobDetails.cron,
            jobId: testJob.id,
            success: true
          });

          // Delete the test job
          await easyCronService.deleteJob(testJob.id);
          
          success = true;
          break; // Stop trying other formats if this one worked
          
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
          logger.error('Test case format failed', {
            name: testCase.name,
            frequency: testCase.frequency,
            cronFormat,
            error: lastError
          });
        }
      }
      
      // If no format worked, add a failure result
      if (!success) {
        results.push({
          name: testCase.name,
          frequency: testCase.frequency,
          error: `All cron formats failed for this frequency. Last error: ${lastError}`,
          success: false
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      apiTest: apiTestResult,
      results,
      message: 'Cron expression tests completed - check logs for details' 
    })
  } catch (error) {
    logger.error('EasyCron cron test error', { 
      error: error instanceof Error ? error.message : error 
    });
    return NextResponse.json(
      { error: 'Failed to test EasyCron cron expressions' },
      { status: 500 }
    )
  }
} 