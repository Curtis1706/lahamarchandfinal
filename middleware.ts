import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_DASHBOARD_PREFIX: Record<string, string[]> = {
  PDG: ["/dashboard/pdg", "/api/pdg"],
  REPRESENTANT: ["/dashboard/representant", "/api/representant"],
  PARTENAIRE: ["/dashboard/partenaire", "/api/partenaire"],
  CONCEPTEUR: ["/dashboard/concepteur", "/api/concepteur"],
  AUTEUR: ["/dashboard/auteur", "/api/auteur"],
  CLIENT: ["/dashboard/client", "/api/client"],
  INVITE: ["/dashboard/invite"], // INVITE n'a généralement pas d'API dédiée
};

// Routes communes accessibles à tous les rôles authentifiés
// Note: Ces routes vérifient l'authentification et les permissions dans leur propre code
const COMMON_ALLOWED = [
  "/dashboard/profile",
  "/dashboard/settings",
  "/api/auth",
  "/api/users/list", // Pour la messagerie
  "/api/users", // Pour la gestion des utilisateurs (vérifie le rôle PDG dans la route)
  "/api/notifications", // Pour les notifications (vérification d'auth dans la route)
  "/api/disciplines", // Pour les disciplines (accessible à tous les rôles authentifiés)
  "/api/works", // Pour les œuvres (vérifie les permissions dans la route)
  "/api/projects", // Pour les projets (vérifie les permissions dans la route)
  "/api/authors/works", // Pour les œuvres d'un auteur (vérifie les permissions dans la route)
  "/api/partners", // Pour les partenaires (vérifie les permissions dans la route)
  "/api/messages", // Pour les messages (vérifie les permissions dans la route)
  "/api/upload", // Pour l'upload de fichiers (vérifie les permissions dans la route)
  "/api/orders", // Pour les commandes (vérifie les permissions dans la route)
  "/api/stock", // Pour le stock (vérifie les permissions dans la route - PDG uniquement)
  "/api/pdg/categories", // Pour les catégories (accessible aux PDG, CLIENT et AUTEUR - vérifie les permissions dans la route)
  "/api/pdg/collections", // Pour les collections (accessible aux PDG et AUTEUR - vérifie les permissions dans la route)
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // On ne filtre que dashboard + api internes
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api");

  if (!isProtected) {
    return NextResponse.next();
  }

  // Routes communes - autorisées AVANT la vérification du cookie
  // (surtout /api/auth qui doit être accessible pour NextAuth)
  if (COMMON_ALLOWED.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Vérifier les cookies de session
  const sessionCookie = req.cookies.get(
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token"
  );

  // Si pas de cookie de session, rediriger vers login
  if (!sessionCookie || !sessionCookie.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development",
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
  });

  // Pas de token ou pas de sub (ID utilisateur) => login
  if (!token || !token.sub) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = String(token.role || "");

  // Vérifier que le rôle est valide et existe dans la map
  if (!role || !ROLE_DASHBOARD_PREFIX[role]) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("error", "InvalidRole");
    return NextResponse.redirect(url);
  }

  const allowedPrefixes = ROLE_DASHBOARD_PREFIX[role];

  // Vérifie que l'URL visitée correspond au rôle
  const isAuthorized = allowedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isAuthorized) {
    // Rediriger vers le bon dashboard du rôle
    const url = req.nextUrl.clone();
    url.pathname = allowedPrefixes[0] || "/dashboard";
    console.log(
      `🔒 Middleware: User with role ${role} tried to access ${pathname}, redirecting to ${url.pathname}`
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
