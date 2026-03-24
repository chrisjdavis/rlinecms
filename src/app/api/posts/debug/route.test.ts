import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      findMany: vi.fn()
    }
  }
}))

const findManyMock = () => vi.mocked(prisma.post.findMany)

describe('GET /api/posts/debug', () => {
  const buildRequest = (query = '') => new Request(`http://localhost/api/posts/debug${query}`)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject access when the session is missing or not an admin', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const response = await GET(buildRequest())
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ error: 'Unauthorized' })
    expect(findManyMock()).not.toHaveBeenCalled()
  })

  it('allows admins to query debug posts data', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'ADMIN',
        email: 'admin@example.com',
        name: 'Admin User'
      },
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    } as any)

    findManyMock().mockResolvedValueOnce([{ id: 'post-1' }] as any)

    const response = await GET(buildRequest('?limit=1&offset=0'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.posts).toHaveLength(1)
    expect(body.debug.postCount).toBe(1)
    expect(findManyMock()).toHaveBeenCalledWith(expect.objectContaining({
      skip: 0,
      take: 1
    }))
  })
})
