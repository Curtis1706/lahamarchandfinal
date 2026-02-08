import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Helper pour vérifier le rôle d'un utilisateur authentifié
 * Utilisé dans les routes API pour s'assurer que seul le bon rôle peut accéder
 * 
 * @param roles - Liste des rôles autorisés (ex: ["AUTEUR", "PDG"])
 * @returns { session, role, userId } si autorisé
 * @throws Error avec message "UNAUTHORIZED" ou "FORBIDDEN"
 */
export async function requireRole(roles: string[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const role = (session.user as { role: string }).role;

  if (!roles.includes(role)) {
    throw new Error("FORBIDDEN");
  }

  return {
    session,
    role,
    userId: session.user.id
  };
}

/**
 * Helper pour créer une réponse d'erreur standardisée
 */
export function createAuthErrorResponse(error: Error) {
  if (error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return NextResponse.json({ error: "Erreur d'autorisation" }, { status: 500 });
}

