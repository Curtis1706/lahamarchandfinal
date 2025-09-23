import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Vérifier si c'est une route admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Vérifier si l'utilisateur est authentifié
    const isAuthenticated = request.cookies.get("admin-auth")?.value === "authenticated"

    // Si pas authentifié et pas sur la page de login, rediriger
    if (!isAuthenticated && !request.nextUrl.pathname.endsWith("/login")) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    // Si authentifié et sur la page de login, rediriger vers admin
    if (isAuthenticated && request.nextUrl.pathname.endsWith("/login")) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/admin/:path*",
}
