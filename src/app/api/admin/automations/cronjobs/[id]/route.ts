import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cronJobRepository } from '@/lib/repositories/cronJobRepository'
import { prisma } from '@/lib/prisma'
import { createEasyCronService } from '@/lib/services/easycronService'
import { getCronExpression } from '@/lib/constants/cronFrequencies'
import { logger } from '@/lib/logger'
import type { UpdateCronJobData } from '@/types/cron'
import type { SiteSettings } from '@prisma/client'

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

export async function GET(
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

    return NextResponse.json(cronJob)
  } catch (error) {
    console.error('Error fetching cron job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cron job' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data: UpdateCronJobData = await req.json()

    // Check if this is an EasyCron job (starts with 'easycron-')
    if (id.startsWith('easycron-')) {
      const easyCronJobId = id.replace('easycron-', '')
      
      try {
        const settings = await prisma.siteSettings.findFirst({
          orderBy: { updatedAt: 'desc' }
        })

        if ((settings as SiteSettings)?.easycronEnabled && (settings as SiteSettings)?.easycronApiKey) {
          const easyCronService = createEasyCronService((settings as SiteSettings).easycronApiKey!)
          
          // Transform the data for EasyCron
          const easyCronData: { name?: string; url?: string; cron?: string; enabled?: boolean } = {}
          if (data.name) easyCronData.name = data.name
          if (data.url) easyCronData.url = data.url
          if (data.frequency) {
            if (data.frequency === 'custom' && data.customExpression) {
              easyCronData.cron = toEasyCronExpression(data.customExpression.trim());
            } else {
              easyCronData.cron = toEasyCronExpression(getCronExpression(data.frequency));
            }
          }
          if (data.enabled !== undefined) easyCronData.enabled = data.enabled

          logger.info('Updating EasyCron job', {
            jobId: easyCronJobId,
            data: easyCronData
          });
          
          await easyCronService.updateJob(easyCronJobId, easyCronData)
          
          logger.info('EasyCron job updated successfully', { jobId: easyCronJobId });
          
          // Return a success response with the updated job data
          return NextResponse.json({
            id,
            name: data.name,
            description: data.description,
            url: data.url,
            frequency: data.frequency,
            cronExpression: data.frequency ? getCronExpression(data.frequency, data.customExpression) : undefined,
            enabled: data.enabled,
            easycronJobId: easyCronJobId,
            updatedAt: new Date()
          })
        } else {
          return NextResponse.json({ error: 'EasyCron not configured' }, { status: 400 })
        }
      } catch (error) {
        logger.error('Error updating EasyCron job', { 
          error: error instanceof Error ? error.message : error,
          jobId: easyCronJobId,
          data 
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to update EasyCron job' },
          { status: 500 }
        )
      }
    } else {
      // Handle local database jobs
      const currentJob = await cronJobRepository.findById(id)
      if (!currentJob) {
        return NextResponse.json({ error: 'Cron job not found' }, { status: 404 })
      }

      // Check if EasyCron is enabled and this job should be synced
      const settings = await prisma.siteSettings.findFirst({
        orderBy: { updatedAt: 'desc' }
      })

      if ((settings as SiteSettings)?.easycronEnabled && (settings as SiteSettings)?.easycronApiKey && currentJob.easycronJobId) {
        try {
          const easyCronService = createEasyCronService((settings as SiteSettings).easycronApiKey!)
          
          // Transform the data for EasyCron
          const easyCronData: { name?: string; url?: string; cron?: string; enabled?: boolean } = {}
          if (data.name) easyCronData.name = data.name
          if (data.url) easyCronData.url = data.url
          if (data.frequency) {
            if (data.frequency === 'custom' && data.customExpression) {
              easyCronData.cron = toEasyCronExpression(data.customExpression.trim());
            } else {
              easyCronData.cron = toEasyCronExpression(getCronExpression(data.frequency));
            }
          }
          if (data.enabled !== undefined) easyCronData.enabled = data.enabled

          // Update the EasyCron job
          await easyCronService.updateJob(currentJob.easycronJobId, easyCronData)
          logger.info('Synced local job update to EasyCron', { 
            jobId: id, 
            easycronJobId: currentJob.easycronJobId 
          });
        } catch (error) {
          logger.error('Failed to sync local job update to EasyCron', { 
            error: error instanceof Error ? error.message : error,
            jobId: id,
            easycronJobId: currentJob.easycronJobId
          });
          // Continue with local update even if EasyCron sync fails
        }
      }

      const cronJob = await cronJobRepository.update(id, data)
      return NextResponse.json(cronJob)
    }
  } catch (error) {
    console.error('Error updating cron job:', error)
    return NextResponse.json(
      { error: 'Failed to update cron job' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if this is an EasyCron job or has an EasyCron ID
    if (id.startsWith('easycron-')) {
      const easyCronJobId = id.replace('easycron-', '')
      
      try {
        const settings = await prisma.siteSettings.findFirst({
          orderBy: { updatedAt: 'desc' }
        })

        if ((settings as SiteSettings)?.easycronEnabled && (settings as SiteSettings)?.easycronApiKey) {
          const easyCronService = createEasyCronService((settings as SiteSettings).easycronApiKey!)
          await easyCronService.deleteJob(easyCronJobId)
          logger.info('Deleted EasyCron job', { jobId: easyCronJobId });
        }
      } catch (error) {
        logger.error('Failed to delete EasyCron job', { 
          error: error instanceof Error ? error.message : error,
          jobId: easyCronJobId 
        });
        // Continue with local deletion even if EasyCron deletion fails
      }
    } else {
      // Check if local job has an EasyCron ID
      const currentJob = await cronJobRepository.findById(id)
      if (currentJob?.easycronJobId) {
        try {
          const settings = await prisma.siteSettings.findFirst({
            orderBy: { updatedAt: 'desc' }
          })

          if ((settings as SiteSettings)?.easycronEnabled && (settings as SiteSettings)?.easycronApiKey) {
            const easyCronService = createEasyCronService((settings as SiteSettings).easycronApiKey!)
            await easyCronService.deleteJob(currentJob.easycronJobId)
            logger.info('Deleted EasyCron job for local job', { 
              localJobId: id, 
              easycronJobId: currentJob.easycronJobId 
            });
          }
        } catch (error) {
          logger.error('Failed to delete EasyCron job for local job', { 
            error: error instanceof Error ? error.message : error,
            localJobId: id,
            easycronJobId: currentJob.easycronJobId
          });
          // Continue with local deletion even if EasyCron deletion fails
        }
      }
    }

    await cronJobRepository.delete(id)

    return NextResponse.json({ message: 'Cron job deleted successfully' })
  } catch (error) {
    const { id } = await params
    logger.error('Error deleting cron job', { 
      error: error instanceof Error ? error.message : error,
      jobId: id 
    });
    return NextResponse.json(
      { error: 'Failed to delete cron job' },
      { status: 500 }
    )
  }
} 