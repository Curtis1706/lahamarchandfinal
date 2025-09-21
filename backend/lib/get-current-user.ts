import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function getCurrentUser(request: NextRequest) {
  try {
    console.log("🔍 Getting current user...")
    console.log("🔍 Cookies:", request.cookies.getAll())
    
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development"
    })
    
    console.log("🔍 Token:", token)
    
    if (!token?.sub) {
      console.log("❌ No token or token.sub found")
      return null
    }
    
    console.log("🔍 Looking for user with ID:", token.sub)
    
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })
    
    console.log("🔍 Found user:", user)
    return user
  } catch (error) {
    console.error("❌ Error getting current user:", error)
    return null
  }
}
