import { NextRequest, NextResponse } from "next/server"

// GET /api/debug-cookies - Debug des cookies
export async function GET(request: NextRequest) {
  const cookies = request.cookies.getAll()
  
  return NextResponse.json({
    cookies: cookies,
    hasNextAuthCookie: cookies.some(c => c.name.includes('next-auth')),
    allCookieNames: cookies.map(c => c.name)
  })
}





