import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Le middleware s'exécute après l'authentification
    console.log("Token:", req.nextauth.token)
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

// Protéger toutes les routes /dashboard
export const config = {
  matcher: ["/dashboard/:path*"]
}
