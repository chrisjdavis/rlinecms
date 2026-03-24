export const CRON_FREQUENCIES = [
  { label: "Every minute", value: "every-minute", cron: "* * * * *" },
  { label: "Every 5 minutes", value: "every-5-minutes", cron: "*/5 * * * *" },
  { label: "Every 10 minutes", value: "every-10-minutes", cron: "*/10 * * * *" },
  { label: "Every 15 minutes", value: "every-15-minutes", cron: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "every-30-minutes", cron: "*/30 * * * *" },
  { label: "Every hour", value: "every-hour", cron: "0 * * * *" },
  { label: "Every 2 hours", value: "every-2-hours", cron: "0 */2 * * *" },
  { label: "Every 6 hours", value: "every-6-hours", cron: "0 */6 * * *" },
  { label: "Every 12 hours", value: "every-12-hours", cron: "0 */12 * * *" },
  { label: "Daily at midnight", value: "daily-midnight", cron: "0 0 * * *" },
  { label: "Daily at 2 AM", value: "daily-2am", cron: "0 2 * * *" },
  { label: "Daily at 6 AM", value: "daily-6am", cron: "0 6 * * *" },
  { label: "Weekly on Sunday", value: "weekly-sunday", cron: "0 0 * * 0" },
  { label: "Weekly on Monday", value: "weekly-monday", cron: "0 0 * * 1" },
  { label: "Monthly on 1st", value: "monthly-1st", cron: "0 0 1 * *" },
  { label: "Custom", value: "custom", cron: "" }
] as const;

export type CronFrequencyValue = typeof CRON_FREQUENCIES[number]['value'];

export const DEFAULT_JOBS = [
  {
    name: "Publish Scheduled Posts",
    description: "Automatically publishes posts that are scheduled for release",
    url: "/api/admin/publish-scheduled",
    frequency: "every-5-minutes" as CronFrequencyValue
  },
  {
    name: "Database Backup",
    description: "Creates a backup of the database",
    url: "/api/admin/backup",
    frequency: "daily-2am" as CronFrequencyValue
  },
  {
    name: "Cleanup Old Logs",
    description: "Removes old log files and execution history",
    url: "/api/admin/cleanup-logs",
    frequency: "weekly-sunday" as CronFrequencyValue
  },
  {
    name: "Analytics Sync",
    description: "Synchronizes analytics data",
    url: "/api/admin/analytics-sync",
    frequency: "every-hour" as CronFrequencyValue
  },
  {
    name: "Email Queue Processing",
    description: "Processes pending email notifications",
    url: "/api/admin/process-email-queue",
    frequency: "every-15-minutes" as CronFrequencyValue
  }
] as const;

export function getCronExpression(frequency: CronFrequencyValue, customExpression?: string): string {
  if (frequency === 'custom' && customExpression) {
    return customExpression;
  }
  
  const frequencyConfig = CRON_FREQUENCIES.find(f => f.value === frequency);
  return frequencyConfig?.cron || "* * * * *";
}

export function getFrequencyLabel(frequency: CronFrequencyValue): string {
  const frequencyConfig = CRON_FREQUENCIES.find(f => f.value === frequency);
  return frequencyConfig?.label || "Custom";
}

export function getFrequencyFromCronExpression(cronExpression: string): CronFrequencyValue {
  // Remove any extra whitespace and normalize
  let normalizedCron = cronExpression.trim();
  
  // Handle EasyCron's 6-field format (seconds included)
  const parts = normalizedCron.split(' ');
  if (parts.length === 6) {
    // Remove seconds field (last field) for comparison
    normalizedCron = parts.slice(0, 5).join(' ');
  }
  
  // Find exact matching frequency
  let frequencyConfig = CRON_FREQUENCIES.find(f => f.cron === normalizedCron);
  
  // If no exact match, try to match equivalent patterns
  if (!frequencyConfig) {
    // Parse the cron expression to understand the pattern
    const cronParts = normalizedCron.split(' ');
    if (cronParts.length === 5) {
      const minutePart = cronParts[0];
      const hourPart = cronParts[1];
      const dayPart = cronParts[2];
      const monthPart = cronParts[3];
      const weekdayPart = cronParts[4];
      
      // Check for "every X minutes" patterns
      if (minutePart.includes('/') && hourPart === '*' && dayPart === '*' && monthPart === '*' && weekdayPart === '*') {
        const interval = minutePart.split('/')[1];
        if (interval === '5') {
          frequencyConfig = CRON_FREQUENCIES.find(f => f.value === "every-5-minutes");
        } else if (interval === '10') {
          frequencyConfig = CRON_FREQUENCIES.find(f => f.value === "every-10-minutes");
        } else if (interval === '15') {
          frequencyConfig = CRON_FREQUENCIES.find(f => f.value === "every-15-minutes");
        } else if (interval === '30') {
          frequencyConfig = CRON_FREQUENCIES.find(f => f.value === "every-30-minutes");
        }
      }
      // Check for "every X hours" patterns
      else if (minutePart === '0' && hourPart.includes('/') && dayPart === '*' && monthPart === '*' && weekdayPart === '*') {
        const interval = hourPart.split('/')[1];
        if (interval === '2') {
          frequencyConfig = CRON_FREQUENCIES.find(f => f.value === "every-2-hours");
        } else if (interval === '6') {
          frequencyConfig = CRON_FREQUENCIES.find(f => f.value === "every-6-hours");
        } else if (interval === '12') {
          frequencyConfig = CRON_FREQUENCIES.find(f => f.value === "every-12-hours");
        }
      }
      // Check for "every hour" pattern
      else if (minutePart === '0' && hourPart === '*' && dayPart === '*' && monthPart === '*' && weekdayPart === '*') {
        frequencyConfig = CRON_FREQUENCIES.find(f => f.value === "every-hour");
      }
      // Check for "every minute" pattern
      else if (minutePart === '*' && hourPart === '*' && dayPart === '*' && monthPart === '*' && weekdayPart === '*') {
        frequencyConfig = CRON_FREQUENCIES.find(f => f.value === "every-minute");
      }
    }
  }
  
  // Return the matching frequency or 'custom' if no match found
  return frequencyConfig?.value || 'custom';
} 