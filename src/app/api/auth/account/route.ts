export const runtime = "nodejs";
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import argon2 from "argon2"
import { userRepository } from '@/lib/repositories/userRepository'

export async function DELETE(req: Request) {
  const session = await auth()
  const clientIp = req.headers.get("x-forwarded-for") || "unknown"

  if (!session || !session.user?.email) {
    logger.info('Account deletion attempt without authentication', { ip: clientIp, audit: true })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { password } = await req.json()

  // Find user
  const user = await userRepository.findById(session.user.email)

  if (!user || user.deletedAt) {
    logger.info('Account deletion attempt for non-existent or already deleted user', { email: session.user.email, ip: clientIp, audit: true })
    return NextResponse.json({ error: 'Account not found or already deleted' }, { status: 404 })
  }

  // Check password
  let valid = false
  if (user.password.startsWith('$2')) {
    valid = await bcrypt.compare(password, user.password)
  } else if (user.password.startsWith('$argon2')) {
    valid = await argon2.verify(user.password, password)
  }

  if (!valid) {
    logger.info('Account deletion attempt with invalid password', { userId: user.id, ip: clientIp, audit: true })
    return NextResponse.json({ error: 'Invalid password' }, { status: 403 })
  }

  // Re-hash with argon2 and update user
  const rehashedPassword = await argon2.hash(password)
  await userRepository.update(user.id, { password: rehashedPassword })

  // Soft delete
  await userRepository.update(user.id, { deletedAt: new Date() })

  logger.info('Account soft deleted', { userId: user.id, ip: clientIp, audit: true })
  return NextResponse.json({ success: true })
} 