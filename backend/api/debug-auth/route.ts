import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Headers:", Object.fromEntries(request.headers.entries()))
    console.log("🔍 Cookies:", request.cookies.getAll())
    
    // Test de session
    const session = await getServerSession(authOptions)
    console.log("🔍 Session:", session)
    
    return NextResponse.json({
      hasSession: !!session,
      session: session,
      headers: Object.fromEntries(request.headers.entries()),
      cookies: request.cookies.getAll()
    })
    
  } catch (error) {
    console.error("Erreur debug auth:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



