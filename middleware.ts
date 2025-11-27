import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { isPublicRoute, isProtectedRoute, GUEST_ROLE } from "@/lib/guest"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Routes publiques - toujours accessibles
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }
  
  // Routes protégées - nécessitent une authentification
  if (isProtectedRoute(pathname)) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development"
      })
      
      // Si pas de token, rediriger vers la page de login avec un message
      if (!token) {
        const loginUrl = new URL("/auth/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        loginUrl.searchParams.set("error", "auth_required")
        return NextResponse.redirect(loginUrl)
      }
      
      // Vérifier que le rôle n'est pas GUEST (ne devrait pas arriver, mais sécurité)
      if (token.role === GUEST_ROLE) {
        const loginUrl = new URL("/auth/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        loginUrl.searchParams.set("error", "guest_not_allowed")
        return NextResponse.redirect(loginUrl)
      }
      
      return NextResponse.next()
    } catch (error) {
      console.error("Middleware auth error:", error)
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Pour toutes les autres routes, permettre l'accès
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
