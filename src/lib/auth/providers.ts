import { prisma } from "../prisma"
import type { NextAuthConfig, Session } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import * as argon2 from "argon2"
import { compare } from "bcryptjs"
import type { User } from "next-auth"
import { JWT } from "next-auth/jwt"
import { Role } from "@prisma/client"

interface ExtendedJWT extends Omit<JWT, "email" | "name"> {
  id: string
  email?: string | null
  name?: string | null
  role?: Role
  emailVerified?: Date | null
  avatar?: string | null
}

interface ExtendedSession extends Omit<Session, "user"> {
  user: {
    id: string
    email?: string | null
    name?: string | null
    role?: Role
    emailVerified?: Date | null
    avatar?: string | null
  }
}

declare global {
  // eslint-disable-next-line no-var -- ambient global declaration
  var __AUTH_PRISMA__: typeof prisma | undefined
  // eslint-disable-next-line no-var -- ambient global declaration
  var __AUTH_COMPARE__: typeof compare | undefined
}

const prismaClient = globalThis.__AUTH_PRISMA__ ?? prisma
const passwordCompare = globalThis.__AUTH_COMPARE__ ?? compare

const credentialsProvider = CredentialsProvider({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" }
  },
  async authorize(credentials) {
    console.log("Auth attempt:", { email: credentials?.email })

    if (!credentials?.email || !credentials?.password) {
      console.log("Missing credentials")
      return null
    }

    const user = await prismaClient.user.findUnique({
      where: {
        email: credentials.email as string
      }
    })

    if (!user) {
      console.log("User not found")
      return null
    }

    if (!user.password) {
      console.log("User has no password")
      return null
    }

    let isPasswordValid = false
    try {
      const password = credentials.password as string
      const hashedPassword = user.password

      if (hashedPassword.startsWith("$argon2")) {
        console.log("Using argon2 verification")
        isPasswordValid = await argon2.verify(hashedPassword, password)
      } else {
        console.log("Using bcrypt verification")
        isPasswordValid = await passwordCompare(password, hashedPassword)
      }

      console.log("Password verification result:", isPasswordValid)
    } catch (error) {
      console.error("Error verifying password:", error)
      return null
    }

    if (!isPasswordValid) {
      console.log("Invalid password")
      return null
    }

    console.log("Auth successful:", { id: user.id, email: user.email })
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    } as User
  }
})

export const authOptions: NextAuthConfig = {
  providers: [credentialsProvider],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login"
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: ExtendedJWT }) {
      const extendedSession = session as ExtendedSession
      if (token) {
        extendedSession.user = {
          ...extendedSession.user,
          id: token.id ?? extendedSession.user.id,
          name: token.name ?? extendedSession.user.name,
          email: token.email ?? extendedSession.user.email,
          avatar: token.avatar ?? extendedSession.user.avatar,
          role: token.role ?? extendedSession.user.role,
          emailVerified: token.emailVerified ?? extendedSession.user.emailVerified
        }
      }
      return extendedSession as Session
    },
    async jwt({ token, user }: { token: JWT; user: User | null }) {
      if (!token.email) {
        if (user) {
          return {
            ...token,
            id: (user as User & { id?: string }).id,
            role: (user as User & { role?: Role }).role ?? (token as ExtendedJWT).role
          }
        }
        return token
      }

      const dbUser = await prismaClient.user.findUnique({
        where: {
          email: token.email
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          emailVerified: true
        }
      })

      if (!dbUser) {
        if (user) {
          token.id = (user as User & { id?: string }).id
        }
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        avatar: dbUser.avatar,
        role: dbUser.role,
        emailVerified: dbUser.emailVerified
      }
    }
  }
}
