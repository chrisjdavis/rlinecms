export const runtime = "nodejs";
import { PrismaClient, Role } from '@prisma/client'
import argon2 from "argon2"

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('Please provide an email and password')
    process.exit(1)
  }

  const hashedPassword = await argon2.hash(password)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: Role.ADMIN
    },
    create: {
      email,
      password: hashedPassword,
      role: Role.ADMIN
    }
  })

  return user;
}

export async function createAdmin(email: string, password: string) {
  const hashedPassword = await argon2.hash(password)
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  return user;
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect()) 