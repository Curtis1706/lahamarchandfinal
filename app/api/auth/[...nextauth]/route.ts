import { logger } from '@/lib/logger'
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Validate required environment variables
if (process.env.NODE_ENV === "production") {
  if (!process.env.NEXTAUTH_SECRET) {
    logger.error("❌ NEXTAUTH_SECRET is missing in production!")
  }
  if (!process.env.NEXTAUTH_URL) {
    logger.error("❌ NEXTAUTH_URL is missing in production!")
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
