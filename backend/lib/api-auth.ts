import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  try {
    // Utiliser NextAuth pour vérifier la session
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Transformer la session en objet user
    const user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role
    }

    return await handler(request, user)
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}