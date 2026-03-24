import { JWT } from "next-auth/jwt"
import { Session } from "next-auth"
import { Role } from "@prisma/client"
import type { Account, Profile, User } from "next-auth"

interface ExtendedToken extends JWT {
  avatar?: string | null
}

interface ExtendedSession extends Session {
  user: {
    id: string
    email: string
    name: string | null
    role: Role
    emailVerified?: Date | null
    avatar?: string | null
  }
}

interface ExtendedUser extends User {
  role: Role
  emailVerified?: Date | null
  avatar?: string | null
}

export const callbacks = {
  async jwt(params: {
    token: JWT
    user: User
    account?: Account | null
    profile?: Profile
    trigger?: "update" | "signIn" | "signUp"
    isNewUser?: boolean
    session?: Session
  }) {
    const { token, user, account } = params

    if (account && user) {
      // Initial sign in
      const extendedUser = user as ExtendedUser
      return {
        ...token,
        id: user.id,
        email: user.email,
        name: user.name,
        role: extendedUser.role,
        emailVerified: extendedUser.emailVerified,
        avatar: extendedUser.avatar,
      }
    }

    // Return previous token if the access token has not expired yet
    return token
  },

  async session({ session, token }: { session: Session; token: JWT }) {
    const extendedSession = session as ExtendedSession
    const extendedToken = token as ExtendedToken

    extendedSession.user = {
      id: extendedToken.id as string,
      email: extendedToken.email as string,
      name: extendedToken.name as string | null,
      role: extendedToken.role as Role,
      emailVerified: extendedToken.emailVerified as Date | null,
      avatar: extendedToken.avatar,
    }

    return extendedSession
  },
} 