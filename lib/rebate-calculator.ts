import { prisma } from "@/lib/prisma"
import { RebateRateType } from "@prisma/client"

/**
 * Obtient le taux de ristourne applicable selon la hiérarchie :
 * WORK > AUTHOR > PARTNER > GLOBAL
 */
export async function getApplicableRebateRate(
  type: 'PARTNER' | 'AUTHOR',
  partnerId?: string | null,
  authorId?: string | null,
  workId?: string | null
): Promise<number> {
  const now = new Date()

  // 1. Taux spécifique à l'œuvre (priorité la plus haute)
  if (workId) {
    const workRate = await prisma.rebateRate.findFirst({
      where: {
        type: 'WORK',
        workId,
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    if (workRate) {
      return workRate.rate
    }
  }

  // 2. Taux spécifique à l'auteur (pour les droits d'auteur)
  if (type === 'AUTHOR' && authorId) {
    const authorRate = await prisma.rebateRate.findFirst({
      where: {
        type: 'AUTHOR',
        userId: authorId,
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    if (authorRate) {
      return authorRate.rate
    }
  }

  // 3. Taux spécifique au partenaire (pour les ristournes partenaires)
  if (type === 'PARTNER' && partnerId) {
    const partnerRate = await prisma.rebateRate.findFirst({
      where: {
        type: 'PARTNER',
        partnerId,
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })

    if (partnerRate) {
      return partnerRate.rate
    }
  }

  // 4. Taux global (par défaut)
  const globalRate = await prisma.rebateRate.findFirst({
    where: {
      type: 'GLOBAL',
      isActive: true,
      OR: [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  })

  if (globalRate) {
    return globalRate.rate
  }

  // Taux par défaut si aucun taux n'est configuré
  return type === 'PARTNER' ? 10 : 15 // 10% pour partenaires, 15% pour auteurs par défaut
}

/**
 * Calcule la ristourne partenaire pour une commande
 */
export async function calculatePartnerRebate(
  orderId: string,
  partnerId: string,
  totalAmount: number,
  discountRatio: number = 1
): Promise<{ amount: number; rate: number }> {
  const rate = await getApplicableRebateRate('PARTNER', partnerId, null, null)
  // totalAmount est déjà le montant payé (net), done le pourcentage s'applique correctement.
  // Si totalAmount était le brut, on devrait faire totalAmount * discountRatio.
  // Par sécurité et cohérence, on assume que totalAmount passé est le montant sur lequel on applique le %.
  const amount = (totalAmount * rate) / 100

  return { amount, rate }
}

/**
 * Calcule les droits d'auteur pour une commande
 */
export async function calculateAuthorRoyalty(
  workId: string,
  authorId: string,
  saleAmount: number,
  discountRatio: number = 1
): Promise<{ amount: number; rate: number }> {
  // 1. Vérifier le taux défini directement sur le livre (Priorité maximale)
  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { royaltyRate: true, royaltyType: true }
  }) as any;

  if (work && work.royaltyRate > 0) {
    let amount = 0;
    if (work.royaltyType === 'PERCENTAGE') {
      // Pourcentage sur le montant de vente (saleAmount)
      amount = (saleAmount * work.royaltyRate) / 100;
      // Note: Si saleAmount est déjà réduit, pas besoin d'appliquer discountRatio à nouveau ici.
    } else {
      // Pour les montants fixes, on doit appliquer le ratio de réduction
      amount = work.royaltyRate * discountRatio;
    }
    return { amount, rate: work.royaltyRate };
  }

  // 2. Fallback sur la hiérarchie existante (RebateRate table)
  const rate = await getApplicableRebateRate('AUTHOR', null, authorId, workId)
  const amount = (saleAmount * rate) / 100

  return { amount, rate }
}


