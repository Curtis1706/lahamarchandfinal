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
      // Vérifier les cookies de session
      const sessionCookie = request.cookies.get(
        process.env.NODE_ENV === 'production' 
          ? '__Secure-next-auth.session-token' 
          : 'next-auth.session-token'
      )
      
      // Si pas de cookie de session, rediriger immédiatement
      if (!sessionCookie || !sessionCookie.value) {
        console.log("🔒 Middleware: No session cookie found, redirecting to login")
        const loginUrl = new URL("/auth/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
      }
      
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development",
        cookieName: process.env.NODE_ENV === 'production' 
          ? '__Secure-next-auth.session-token' 
          : 'next-auth.session-token'
      })
      
      // Si pas de token ou pas de sub (ID utilisateur), rediriger vers la page de login
      if (!token || !token.sub) {
        console.log("🔒 Middleware: No token or sub, redirecting to login")
        const loginUrl = new URL("/auth/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
      }
      
      // Vérifier que le rôle existe et n'est pas GUEST
      const validRoles = ['PDG', 'REPRESENTANT', 'PARTENAIRE', 'CONCEPTEUR', 'AUTEUR', 'CLIENT']
      if (!token.role || token.role === GUEST_ROLE || !validRoles.includes(token.role as string)) {
        console.log("🔒 Middleware: Invalid role", token.role, ", redirecting to login")
        const loginUrl = new URL("/auth/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
      }
      
      console.log("✅ Middleware: User authenticated with role", token.role)
      return NextResponse.next()
    } catch (error) {
      console.error("🔒 Middleware auth error:", error)
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
