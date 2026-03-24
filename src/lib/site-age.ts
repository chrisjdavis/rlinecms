import { postRepository } from './repositories/postRepository'
import { differenceInYears, differenceInMonths, differenceInDays, subYears, subMonths } from 'date-fns'

export async function getSiteAge() {
  const oldestPost = await postRepository.findOldest()

  if (!oldestPost) {
    return null
  }

  const now = new Date()
  const startDate = new Date(oldestPost.createdAt)

  const years = differenceInYears(now, startDate)
  const afterYears = subYears(now, years)
  const months = differenceInMonths(afterYears, startDate)
  const afterMonths = subMonths(afterYears, months)
  const days = differenceInDays(afterMonths, startDate)

  return {
    years,
    months,
    days,
    startDate
  }
} 