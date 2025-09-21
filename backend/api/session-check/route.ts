import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"

export async function GET(request: NextRequest) {
  console.log("🔍 Session check API called")
  
  const user = await getCurrentUser(request)
  
  return NextResponse.json({
    authenticated: !!user,
    user: user,
    timestamp: new Date().toISOString()
  })
}



