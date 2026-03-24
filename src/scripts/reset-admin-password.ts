import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

function usage() {
  console.error(`Usage:
  npx tsx src/scripts/reset-admin-password.ts <email> <newPassword>
Or set RESET_ADMIN_EMAIL and RESET_ADMIN_PASSWORD in the environment.`)
}

async function main() {
  const email =
    process.argv[2]?.trim() || process.env.RESET_ADMIN_EMAIL?.trim()
  const newPassword =
    process.argv[3] || process.env.RESET_ADMIN_PASSWORD

  if (!email || !newPassword) {
    usage()
    process.exit(1)
  }

  console.log(`Resetting password for ${email}...`)

  const hashedPassword = await argon2.hash(newPassword)

  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Password reset successful.')
  console.log('User updated:', { id: user.id, email: user.email, role: user.role })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
