import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function getCurrentUser(request: NextRequest) {
  try {
            
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development"
    })
    
        
    if (!token?.sub) {
            return null
    }
    
        
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
    
        return user
  } catch (error) {
    console.error("❌ Error getting current user:", error)
    return null
  }
}

