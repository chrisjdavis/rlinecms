import { Role } from "../../prisma/generated/prisma"

declare module "next-auth" {
  interface User {
    id: string
    role: Role
  }

  interface Session {
    user: User & {
      id: string
      role: Role
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
  }
} 