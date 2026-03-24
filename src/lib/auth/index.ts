import NextAuth from "next-auth"
import { authOptions } from "./providers"

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set")
}

const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

export { auth, signIn, signOut }
export const { GET, POST } = handlers 