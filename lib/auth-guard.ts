/**
 * Guard d'authentification pour les routes API
 * Gère l'authentification et les permissions, y compris le mode invité
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GUEST_ROLE, isGuestRole, hasAccess, checkPermission, type UserRole } from "@/lib/guest"

export interface AuthContext {
  user: {
    id: string | null
    email: string | null
    name: string | null
    role: UserRole
    clientType?: string | null
  }
  isGuest: boolean
  isAuthenticated: boolean
}

/**
 * Récupère le contexte d'authentification (incluant le mode invité)
 */
export async function getAuthContext(): Promise<AuthContext> {
  try {
    const session = await getServerSession(authOptions)

    if (session?.user) {
      return {
        user: {
          id: session.user.id || null,
          email: session.user.email || null,
          name: session.user.name || null,
          role: (session.user.role as UserRole) || GUEST_ROLE,
          clientType: session.user.clientType
        },
        isGuest: false,
        isAuthenticated: true
      }
    }

    // Pas de session = mode invité
    return {
      user: {
        id: null,
        email: null,
        name: null,
        role: GUEST_ROLE
      },
      isGuest: true,
      isAuthenticated: false
    }
  } catch (error) {
    console.error("Error getting auth context:", error)
    // En cas d'erreur, retourner le mode invité
    return {
      user: {
        id: null,
        email: null,
        name: null,
        role: GUEST_ROLE
      },
      isGuest: true,
      isAuthenticated: false
    }
  }
}

/**
 * Wrapper pour protéger une route API avec authentification requise
 */
export function requireAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const context = await getAuthContext()

    if (context.isGuest) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      )
    }

    return handler(request, context)
  }
}

/**
 * Wrapper pour protéger une route API avec des rôles spécifiques
 */
export function requireRole(
  allowedRoles: UserRole[],
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const context = await getAuthContext()

    if (!hasAccess(context.user.role, allowedRoles)) {
      return NextResponse.json(
        { error: "Accès refusé. Permissions insuffisantes." },
        { status: 403 }
      )
    }

    return handler(request, context)
  }
}

/**
 * Wrapper pour une route accessible en mode invité ou authentifié
 */
export function allowGuest(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const context = await getAuthContext()
    return handler(request, context)
  }
}

/**
 * Vérifie une permission spécifique
 */
export function requirePermission(
  permission: keyof typeof import("@/lib/guest").ROLE_PERMISSIONS[UserRole],
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const context = await getAuthContext()

    if (!checkPermission(context.user.role, permission)) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      )
    }

    return handler(request, context)
  }
}

