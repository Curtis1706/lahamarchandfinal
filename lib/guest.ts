/**
 * Gestion du mode invité (Guest Mode)
 * 
 * Le mode invité permet d'accéder à certaines pages publiques
 * sans authentification ni création de compte.
 */

export const GUEST_ROLE = 'GUEST' as const

export type UserRole = 'PDG' | 'REPRESENTANT' | 'PARTENAIRE' | 'CONCEPTEUR' | 'AUTEUR' | 'CLIENT' | typeof GUEST_ROLE

/**
 * Vérifie si un rôle est un rôle invité
 */
export function isGuestRole(role: string | undefined | null): boolean {
  return role === GUEST_ROLE || !role
}

/**
 * Vérifie si un utilisateur a accès à une route
 */
export function hasAccess(role: UserRole | string | undefined, allowedRoles: UserRole[]): boolean {
  if (!role) {
    // Si pas de rôle, vérifier si GUEST est autorisé
    return allowedRoles.includes(GUEST_ROLE)
  }
  return allowedRoles.includes(role as UserRole)
}

/**
 * Routes publiques accessibles en mode invité
 */
export const PUBLIC_ROUTES = [
  '/',
  '/catalogue',
  '/livre',
  '/checkout',
  '/dashboard/invite',
  '/commande-confirmee',
  '/works/public',
  '/projects/public',
  '/about',
  '/faq',
  '/terms',
  '/contact',
  '/demo',
  '/auth/login',
  '/auth/signup',
  '/auth/error'
] as const

/**
 * Routes protégées nécessitant une authentification
 */
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/works',
  '/stock',
  '/partners',
  '/representatives',
  '/admin'
] as const

/**
 * Vérifie si une route est publique
 */
export function isPublicRoute(pathname: string): boolean {
  // Vérifier d'abord les routes exactes
  if (PUBLIC_ROUTES.includes(pathname as any)) {
    return true
  }
  // Vérifier les routes qui commencent par les routes publiques
  return PUBLIC_ROUTES.some(route => {
    // Pour /dashboard/invite, on veut une correspondance exacte ou qui commence par (inclut /dashboard/invite/catalogue)
    if (route === '/dashboard/invite') {
      return pathname === route || pathname.startsWith(route + '/')
    }
    // Pour les autres routes, on vérifie si elles commencent par la route publique
    return pathname.startsWith(route)
  })
}

/**
 * Vérifie si une route est protégée
 */
export function isProtectedRoute(pathname: string): boolean {
  // Exception : /dashboard/invite est publique
  if (pathname === '/dashboard/invite' || pathname.startsWith('/dashboard/invite/')) {
    return false
  }
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, {
  canViewWorks: boolean
  canCreateWorks: boolean
  canEditWorks: boolean
  canDeleteWorks: boolean
  canViewProjects: boolean
  canCreateProjects: boolean
  canViewStock: boolean
  canManageStock: boolean
  canViewDashboard: boolean
}> = {
  GUEST: {
    canViewWorks: true, // Seulement les œuvres PUBLISHED
    canCreateWorks: false,
    canEditWorks: false,
    canDeleteWorks: false,
    canViewProjects: false, // Les invités ne voient pas les projets
    canCreateProjects: false,
    canViewStock: false, // Les invités ne voient pas le stock interne
    canManageStock: false,
    canViewDashboard: false // Les invités n'ont pas accès au dashboard
  },
  PDG: {
    canViewWorks: true,
    canCreateWorks: true,
    canEditWorks: true,
    canDeleteWorks: true,
    canViewProjects: true,
    canCreateProjects: true,
    canViewStock: true,
    canManageStock: true,
    canViewDashboard: true
  },
  REPRESENTANT: {
    canViewWorks: true,
    canCreateWorks: false,
    canEditWorks: false,
    canDeleteWorks: false,
    canViewProjects: true,
    canCreateProjects: false,
    canViewStock: true,
    canManageStock: false,
    canViewDashboard: true
  },
  PARTENAIRE: {
    canViewWorks: true,
    canCreateWorks: false,
    canEditWorks: false,
    canDeleteWorks: false,
    canViewProjects: false,
    canCreateProjects: false,
    canViewStock: true,
    canManageStock: false,
    canViewDashboard: true
  },
  CONCEPTEUR: {
    canViewWorks: true,
    canCreateWorks: true,
    canEditWorks: true,
    canDeleteWorks: false,
    canViewProjects: true,
    canCreateProjects: true,
    canViewStock: false,
    canManageStock: false,
    canViewDashboard: true
  },
  AUTEUR: {
    canViewWorks: true,
    canCreateWorks: true,
    canEditWorks: true,
    canDeleteWorks: false,
    canViewProjects: false,
    canCreateProjects: false,
    canViewStock: false,
    canManageStock: false,
    canViewDashboard: true
  },
  CLIENT: {
    canViewWorks: true,
    canCreateWorks: false,
    canEditWorks: false,
    canDeleteWorks: false,
    canViewProjects: false,
    canCreateProjects: false,
    canViewStock: false,
    canManageStock: false,
    canViewDashboard: true
  }
}

/**
 * Vérifie une permission pour un rôle
 */
export function checkPermission(
  role: UserRole | string | undefined,
  permission: keyof typeof ROLE_PERMISSIONS[UserRole]
): boolean {
  const userRole = (role || GUEST_ROLE) as UserRole
  return ROLE_PERMISSIONS[userRole]?.[permission] ?? false
}

