/**
 * Cache centralisé pour optimiser les performances
 * Utilise unstable_cache de Next.js 14
 */

import { unstable_cache, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'

// ============================================
// DISCIPLINES (réutilisées partout)
// ============================================

export const getCachedDisciplines = unstable_cache(
  async () => {
    return await prisma.discipline.findMany({
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    })
  },
  ['disciplines-list'],
  {
    revalidate: 3600, // 1 heure
    tags: ['disciplines']
  }
)

export async function revalidateDisciplines() {
  revalidateTag('disciplines')
}

// ============================================
// STATISTIQUES DASHBOARD
// ============================================

export const getCachedDashboardStats = unstable_cache(
  async (userId: string, role: string) => {
    // Logique spécifique selon le rôle
    switch (role) {
      case 'PDG':
        return await getPDGStats()
      case 'AUTEUR':
        return await getAuthorStats(userId)
      case 'PARTENAIRE':
        return await getPartnerStats(userId)
      default:
        return null
    }
  },
  ['dashboard-stats'],
  {
    revalidate: 300, // 5 minutes
    tags: ['stats']
  }
)

async function getPDGStats() {
  const [totalOrders, totalWorks, totalUsers] = await Promise.all([
    prisma.order.count(),
    prisma.work.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count()
  ])

  return { totalOrders, totalWorks, totalUsers }
}

async function getAuthorStats(userId: string) {
  const [totalWorks, totalRoyalties] = await Promise.all([
    prisma.work.count({ where: { authorId: userId } }),
    prisma.royalty.aggregate({
      where: { userId },
      _sum: { amount: true }
    })
  ])

  return {
    totalWorks,
    totalRoyalties: totalRoyalties._sum.amount || 0
  }
}

async function getPartnerStats(userId: string) {
  const partner = await prisma.partner.findFirst({
    where: { userId },
    include: {
      stockItems: true,
      orders: true
    }
  })

  if (!partner) return null

  return {
    totalStock: partner.stockItems.reduce((sum, item) => sum + item.availableQuantity, 0),
    totalOrders: partner.orders.length
  }
}

export async function revalidateStats() {
  revalidateTag('stats')
}

// ============================================
// LISTE DES ŒUVRES PUBLIÉES
// ============================================

export const getCachedPublishedWorks = unstable_cache(
  async () => {
    return await prisma.work.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        price: true,
        stock: true,
        isbn: true,
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    })
  },
  ['published-works'],
  {
    revalidate: 600, // 10 minutes
    tags: ['works']
  }
)

export async function revalidateWorks() {
  revalidateTag('works')
}

// ============================================
// UTILITAIRES DE CACHE
// ============================================

export function clearAllCache() {
  revalidateTag('disciplines')
  revalidateTag('stats')
  revalidateTag('works')
}

// Fonction helper pour invalidation multiple
export function revalidateMultiple(...tags: string[]) {
  tags.forEach(tag => revalidateTag(tag))
}

