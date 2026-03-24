import { Role } from "@prisma/client"
import { DefaultSession } from "next-auth"

// Extend the built-in types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: Role
      emailVerified?: Date | null
      avatar?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: Role
    emailVerified?: Date | null
    avatar?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name?: string | null
    role: Role
    emailVerified?: Date | null
    avatar?: string | null
  }
} 