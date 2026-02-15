import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/pdg/ventes-retours - Récupérer toutes les ventes et retours
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const statusFilter = searchParams.get('status')
    const methodFilter = searchParams.get('method')
    const searchTerm = searchParams.get('search')
    const accountFilter = searchParams.get('account') // 'client' ou 'partenaire'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construire les filtres de date
    const whereClause: any = {}
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (accountFilter && accountFilter !== 'all') {
      if (accountFilter === 'client') {
        whereClause.partnerId = null
      } else if (accountFilter === 'partenaire') {
        whereClause.partnerId = { not: null }
      }
    }

    // Force filtering by 'depot' payment method for this page
    whereClause.paymentMethod = 'depot'

    // Récupérer toutes les commandes (ventes)
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true }
        },
        partner: {
          select: { name: true }
        },
        items: {
          include: {
            work: {
              select: { title: true, price: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transformer les commandes en format vente/retour
    const ventesRetours = orders.map(order => {
      const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0)
      // Utiliser order.total qui contient le montant net après réductions
      const totalAmount = order.total

      // Déterminer le type (vente ou retour basé sur le statut)
      // Pour les dépôts, un retour est souvent une annulation ou un retour partiel
      // Conflict resolved: using manual status check instead of missing calculateType
      const type = order.status === 'CANCELLED' ? 'retour' : 'depot'

      // Déterminer le compte
      const compte = order.partner ? 'Partenaire' : 'Client'

      // Déterminer le statut
      let statut = 'En attente'
      if (order.status === 'DELIVERED') statut = 'Validée'
      else if (order.status === 'SHIPPED') statut = 'En cours'
      else if (order.status === 'PROCESSING') statut = 'En traitement'
      else if (order.status === 'CANCELLED') statut = 'Retourné'
      else if (order.status === 'VALIDATED') statut = 'Validée'
      else if (order.status === 'PENDING') statut = 'En attente'

      return {
        id: order.id,
        reference: `ORD-${order.id.slice(-8).toUpperCase()}`,
        qty: totalQty,
        montant: totalAmount,
        statut: statut,
        compte: compte,
        paiements: order.paymentStatus === 'PAID' ? 'Payé' : 'Non Payé',
        methode: order.paymentMethod || 'depot',
        creeLe: format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr }),
        validePar: (order.status === 'VALIDATED' || order.status === 'DELIVERED') ? 'PDG' : '-',
        modifieLe: format(new Date(order.updatedAt), 'dd MMM yyyy, HH:mm', { locale: fr }),
        type: type,
        clientName: order.user?.name || 'N/A',
        partnerName: order.partner?.name || null,
        createdAt: order.createdAt,
        status: order.status,
        items: order.items.map(item => ({
          workId: item.workId,
          workTitle: item.work.title,
          quantity: item.quantity,
          price: item.price
        }))
      }
    })

    // Filtrer par statut
    let filtered = ventesRetours
    if (statusFilter && statusFilter !== 'all' && statusFilter !== 'all-status') {
      filtered = filtered.filter(v => v.statut === statusFilter)
    }

    // Filtrer par méthode de paiement (Redundant if we force depot, but keep for safety/reuse)
    if (methodFilter && methodFilter !== 'all' && methodFilter !== 'all-methods') {
      filtered = filtered.filter(v =>
        v.methode.toLowerCase().includes(methodFilter.toLowerCase())
      )
    }

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.partnerName && v.partnerName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Calculer les statistiques
    const commandes = filtered.length
    const depots = filtered.filter(v => v.type === 'depot')
    const retours = filtered.filter(v => v.type === 'retour')
    // En dépôts (Non payé et non annulé)
    const enDepots = filtered.filter(v => (v.statut !== 'Retourné' && v.paiements !== 'Payé'))

    const montantCommandes = filtered.reduce((sum, v) => sum + v.montant, 0)
    const montantDepots = depots.reduce((sum, v) => sum + v.montant, 0)
    const montantRetours = retours.reduce((sum, v) => sum + v.montant, 0)
    const montantEnDepots = enDepots.reduce((sum, v) => sum + (v.type === 'retour' ? 0 : v.montant), 0)

    // Pagination
    const paginated = filtered.slice(skip, skip + limit)
    const totalItems = filtered.length

    return NextResponse.json({
      ventesRetours: paginated,
      stats: {
        commandes: { count: commandes, montant: montantCommandes },
        ventes: { count: depots.length, montant: montantDepots },
        retours: { count: retours.length, montant: montantRetours },
        enDepots: { count: enDepots.length, montant: montantEnDepots }
      },
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit)
    })

  } catch (error) {
    logger.error('Error fetching ventes-retours:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

// POST /api/pdg/ventes-retours - Créer une vente (Dépôt) ou un retour
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { items, clientId, partnerId, observation, type, paymentDueDate } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Les items sont requis' }, { status: 400 })
    }

    // Vérifier que le client ou partenaire existe
    if (!clientId && !partnerId) {
      return NextResponse.json({ error: 'Client ou partenaire requis' }, { status: 400 })
    }

    if (clientId) {
      const client = await prisma.user.findUnique({ where: { id: clientId } })
      if (!client) {
        return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
      }
    }

    if (partnerId) {
      const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
      if (!partner) {
        return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
      }
    }

    // Vérifier le stock pour chaque item
    for (const item of items) {
      const work = await prisma.work.findUnique({ where: { id: item.workId } })
      if (!work) {
        return NextResponse.json({ error: `Livre ${item.workId} introuvable` }, { status: 404 })
      }

      if (type === 'vente' && work.stock < item.quantity) {
        return NextResponse.json({
          error: `Stock insuffisant pour ${work.title}. Disponible: ${work.stock}, Demandé: ${item.quantity}`
        }, { status: 400 })
      }
    }

    // Récupérer les prix des livres si non fournis
    const itemsWithPrices = await Promise.all(
      items.map(async (item: any) => {
        if (item.price) {
          return item
        }
        const work = await prisma.work.findUnique({
          where: { id: item.workId },
          select: { price: true }
        })
        return {
          ...item,
          price: work?.price || 0
        }
      })
    )

    // Récupérer le userId du partenaire si nécessaire
    let finalUserId = clientId || session.user.id
    if (partnerId && !clientId) {
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        select: { userId: true }
      })
      if (partner?.userId) {
        finalUserId = partner.userId
      }
    }

    // Créer la commande
    // Force paymentMethod = 'depot' for sales here
    const finalPaymentMethod = type === 'vente' ? 'depot' : null

    const order = await prisma.order.create({
      data: {
        userId: finalUserId,
        partnerId: partnerId || null,
        paymentMethod: finalPaymentMethod,
        // @ts-ignore
        paymentDueDate: paymentDueDate ? new Date(paymentDueDate) : null, // Set the due date
        status: type === 'retour' ? 'CANCELLED' : 'PENDING',
        items: {
          create: itemsWithPrices.map((item: any) => ({
            workId: item.workId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: {
          include: {
            work: true
          }
        }
      }
    })

    // Mettre à jour le stock
    if (type === 'vente') {
      for (const item of items) {
        await prisma.work.update({
          where: { id: item.workId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })

        // Créer un mouvement de stock
        await prisma.stockMovement.create({
          data: {
            workId: item.workId,
            type: 'DIRECT_SALE',
            quantity: -item.quantity,
            reason: `Dépôt - ${observation || 'Créé par PDG'}`,
            reference: `SALE_${order.id}`,
            performedBy: session.user.id
          }
        })
      }
    } else if (type === 'retour') {
      // Pour un retour, on ré-incrémente le stock
      for (const item of items) {
        await prisma.work.update({
          where: { id: item.workId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        })

        // Créer un mouvement de stock (Retour)
        // Note: Using DIRECT_SALE with positive quantity to represent return/correction based on schema discussion
        // ideally PARTNER_RETURN or CORRECTION could be used if strictly defined, but DIRECT_SALE inverse is safe for net calculations.
        // Let's use CORRECTION for clarity in logs if available, or DIRECT_SALE. 
        // Available: DIRECT_SALE, CORRECTION, PARTNER_RETURN. 
        // Let's use CORRECTION as it's general purpose return/fix.

        await prisma.stockMovement.create({
          data: {
            workId: item.workId,
            type: 'CORRECTION',
            quantity: item.quantity,
            reason: `Retour produit - ${observation || 'Retour Dépôt'}`,
            reference: `RET_${order.id}`,
            performedBy: session.user.id
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: type === 'vente' ? 'Dépôt enregistré avec succès' : 'Retour enregistré avec succès',
      order: {
        id: order.id,
        reference: `ORD-${order.id.slice(-8).toUpperCase()}`,
        type: type,
        // @ts-ignore
        items: order.items
      }
    }, { status: 201 })

  } catch (error: any) {
    logger.error('Error creating vente/retour:', error)
    return NextResponse.json({
      error: error.message || 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

