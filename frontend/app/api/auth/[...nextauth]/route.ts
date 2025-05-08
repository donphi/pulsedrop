import NextAuth from "next-auth"
import { authOptions } from '@/lib/auth'

// Export a standard NextAuth handler - don't use the imported auth
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }