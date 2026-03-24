import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cronJobRepository } from '@/lib/repositories/cronJobRepository'
import { prisma } from '@/lib/prisma'
import { createEasyCronService } from '@/lib/services/easycronService'
import { getCronExpression, getFrequencyFromCronExpression } from '@/lib/constants/cronFrequencies'
import { logger } from '@/lib/logger'
import { logUserActivity } from '@/lib/activityLog'
import type { CronJob } from '@/types/cron'

type SiteSettings = {
  easycronEnabled?: boolean;
  easycronApiKey?: string;
  // add other fields as needed
};

// Helper to ensure correct cron format for EasyCron
// Based on testing, EasyCron accepts standard 5-field cron expressions
function toEasyCronExpression(cron: string) {
  const parts = cron.trim().split(' ');
  if (parts.length === 5) {
    // Standard 5-field cron: minute hour day month weekday
    // EasyCron accepts this format directly
    return cron.trim();
  } else if (parts.length === 6) {
    // If it's already 6-field, remove the seconds field
    // EasyCron expects: minute hour day month weekday
    return parts.slice(1).join(' ');
  }
  throw new Error(`Invalid cron expression: ${cron}`);
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get settings to check if EasyCron is configured
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    }) as SiteSettings | null;

    const cronJobs = await cronJobRepository.findAll({
      orderBy: { createdAt: 'desc' }
    })

    // If EasyCron is enabled and configured, sync jobs from EasyCron
    if (settings?.easycronEnabled && settings?.easycronApiKey) {
      try {
        const easyCronService = createEasyCronService(settings.easycronApiKey)
        const easyCronJobs = await easyCronService.listJobs()
        
        logger.info('Syncing with EasyCron', { 
          localJobCount: cronJobs.length, 
          easyCronJobCount: easyCronJobs.length 
        });
        
        // Merge EasyCron jobs with local jobs
        const easyCronJobMap = new Map(easyCronJobs.map(job => [job.id, job]))
        
        // Update local jobs with EasyCron data
        for (const localJob of cronJobs) {
          if (localJob.easycronJobId && easyCronJobMap.has(localJob.easycronJobId)) {
            const easyCronJob = easyCronJobMap.get(localJob.easycronJobId)!
            localJob.enabled = easyCronJob.enabled
            localJob.lastRun = easyCronJob.last_run ? new Date(easyCronJob.last_run) : null
            localJob.nextRun = easyCronJob.next_run ? new Date(easyCronJob.next_run) : null
            easyCronJobMap.delete(localJob.easycronJobId)
            
            logger.info('Updated local job with EasyCron data', { 
              localJobId: localJob.id, 
              easycronJobId: localJob.easycronJobId 
            });
          }
        }

        // Add new EasyCron jobs that aren't in local database
        for (const easyCronJob of easyCronJobMap.values()) {
          // Check if we already have a local job with this EasyCron ID
          const existingLocalJob = cronJobs.find(job => job.easycronJobId === easyCronJob.id);
          
          if (!existingLocalJob) {
            // Also check if we have a local job with the same name and URL (to avoid duplicates)
            const duplicateLocalJob = cronJobs.find(job => 
              job.name === easyCronJob.name && 
              job.url === easyCronJob.url &&
              !job.easycronJobId // Only check local jobs that don't have an EasyCron ID yet
            );
            
            if (!duplicateLocalJob) {
              // Check if there are any recently created local jobs (within last 2 minutes)
              // that might match this EasyCron job to avoid importing duplicates
              const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
              const recentlyCreatedLocalJob = cronJobs.find(job => 
                job.createdAt > twoMinutesAgo &&
                job.name === easyCronJob.name &&
                job.url === easyCronJob.url &&
                !job.easycronJobId // Only check local jobs that don't have an EasyCron ID yet
              );
              
              if (!recentlyCreatedLocalJob) {
                const frequency = getFrequencyFromCronExpression(easyCronJob.cron)
                const createdJob = await cronJobRepository.create({
                  name: easyCronJob.name,
                  description: `Synced from EasyCron`,
                  url: easyCronJob.url,
                  frequency,
                  customExpression: easyCronJob.cron
                }, session.user.id)
                
                // Update the job with EasyCron-specific data
                await cronJobRepository.updateEasyCronJobId(createdJob.id, easyCronJob.id)
                if (easyCronJob.last_run) {
                  await cronJobRepository.updateLastRun(createdJob.id, new Date(easyCronJob.last_run))
                }
                if (easyCronJob.next_run) {
                  await cronJobRepository.updateNextRun(createdJob.id, new Date(easyCronJob.next_run))
                }
                
                logger.info('Imported new EasyCron job', { 
                  easycronJobId: easyCronJob.id, 
                  name: easyCronJob.name 
                });
              } else {
                logger.info('Skipped importing EasyCron job - recently created local job exists', { 
                  easycronJobId: easyCronJob.id, 
                  name: easyCronJob.name,
                  localJobId: recentlyCreatedLocalJob.id,
                  localJobCreatedAt: recentlyCreatedLocalJob.createdAt
                });
              }
            } else {
              logger.info('Skipped importing EasyCron job - duplicate local job exists', { 
                easycronJobId: easyCronJob.id, 
                name: easyCronJob.name,
                localJobId: duplicateLocalJob.id
              });
            }
          } else {
            logger.info('Skipped importing EasyCron job - already linked to local job', { 
              easycronJobId: easyCronJob.id, 
              name: easyCronJob.name,
              localJobId: existingLocalJob.id
            });
          }
        }
        
        logger.info('EasyCron sync completed', { 
          totalJobs: cronJobs.length,
          importedJobs: easyCronJobMap.size
        });
      } catch (error) {
        logger.error('Error syncing with EasyCron', { 
          error: error instanceof Error ? error.message : error 
        });
        // Continue with local jobs only if EasyCron sync fails
      }
    }

    return NextResponse.json(cronJobs)
  } catch (error) {
    logger.error('Error fetching cron jobs', { 
      error: error instanceof Error ? error.message : error 
    });
    return NextResponse.json(
      { error: 'Failed to fetch cron jobs' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: CronJob = await req.json()

    // Validate required fields
    if (!data.name || !data.url || !data.frequency) {
      return NextResponse.json(
        { error: 'Name, URL, and frequency are required' },
        { status: 400 }
      )
    }

    // Check if EasyCron is enabled and configured
    const settings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    }) as SiteSettings | null;

    let easycronJobId: string | undefined;

    if (settings?.easycronEnabled && settings?.easycronApiKey) {
      try {
        const easyCronService = createEasyCronService(settings.easycronApiKey)
        
        // Prepare cron expression
        const originalCron = data.frequency === 'custom' && data.cronExpression 
          ? data.cronExpression.trim()
          : getCronExpression(data.frequency);
        const cronExpression = toEasyCronExpression(originalCron);

        logger.info('Creating EasyCron job with cron expression', {
          frequency: data.frequency,
          originalCron,
          easyCronExpression: cronExpression,
          name: data.name
        });

        // Create job in EasyCron
        const easyCronResponse = await easyCronService.createJob({
          name: data.name,
          url: data.url,
          cron: cronExpression,
          enabled: true // Default to enabled for new jobs
        });

        easycronJobId = easyCronResponse.id;
        logger.info('Created EasyCron job', { 
          jobId: easyCronResponse.id, 
          name: data.name 
        });
      } catch (error) {
        logger.error('Failed to create EasyCron job', { 
          error: error instanceof Error ? error.message : error,
          data 
        });
        // Continue with local creation even if EasyCron creation fails
      }
    }

    // Create the cron job
    const cronJob = await cronJobRepository.create(data, session.user.id)

    // Log the activity
    await logUserActivity({
      userId: session.user.id,
      action: 'cron_job_created',
      ip: req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      metadata: {
        cronJobId: cronJob.id,
        cronJobName: data.name,
        frequency: data.frequency,
        easycronJobId,
      },
    });

    return NextResponse.json(cronJob)
  } catch (error) {
    logger.error('Error creating cron job', { 
      error: error instanceof Error ? error.message : error 
    });
    return NextResponse.json(
      { error: 'Failed to create cron job' },
      { status: 500 }
    )
  }
} 