import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/partenaire/orders - Commandes du partenaire
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    // Récupérer l'utilisateur pour obtenir ses informations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer le partenaire associé à l'utilisateur, ou le créer s'il n'existe pas
    let partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      // Créer automatiquement un Partner pour les utilisateurs existants
      try {
        partner = await prisma.partner.create({
          data: {
            name: user.name,
            type: 'INDEPENDANT',
            userId: user.id,
            email: user.email,
            phone: user.phone || null,
            contact: user.name,
          }
        })
        logger.debug("✅ Partenaire créé automatiquement pour l'utilisateur existant:", user.name)
      } catch (partnerError: any) {
        logger.error("❌ Erreur lors de la création automatique du partenaire:", partnerError)
        return NextResponse.json({ error: 'Erreur lors de la création du partenaire' }, { status: 500 })
      }
    }

    const whereClause: any = {
      partnerId: partner.id
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                discipline: {
                  select: {
                    name: true
                  }
                },
                author: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filtrer par recherche si nécessaire
    let filteredOrders = orders
    if (search) {
      filteredOrders = orders.filter(order => 
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.items.some(item => 
          item.work.title.toLowerCase().includes(search.toLowerCase())
        )
      )
    }

    // Transformer les données pour l'affichage
    const ordersData = filteredOrders.map(order => ({
      id: order.id,
      reference: order.id, // Utiliser l'ID comme référence pour l'instant
      status: order.status,
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map(item => ({
        id: item.id,
        work: {
          id: item.work.id,
          title: item.work.title,
          isbn: item.work.isbn || 'N/A',
          discipline: item.work.discipline?.name || 'Non définie',
          author: item.work.author?.name || 'Auteur inconnu'
        },
        quantity: item.quantity,
        price: item.price
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }))

    return NextResponse.json({
      orders: ordersData,
      total: ordersData.length
    })

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des commandes partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/partenaire/orders - Créer une nouvelle commande
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { items, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'Au moins un article est requis' 
      }, { status: 400 })
    }

    // Valider que toutes les quantités sont valides (strictement supérieures à 0)
    for (const item of items) {
      if (!item.workId) {
        return NextResponse.json({ 
          error: `workId manquant pour un article` 
        }, { status: 400 })
      }
      if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return NextResponse.json({ 
          error: `Quantité invalide pour l'article ${item.workId}. La quantité doit être un entier strictement positif` 
        }, { status: 400 })
      }
    }

    // Récupérer l'utilisateur pour obtenir ses informations
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer le partenaire associé à l'utilisateur, ou le créer s'il n'existe pas
    let partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      // Créer automatiquement un Partner pour les utilisateurs existants
      try {
        partner = await prisma.partner.create({
          data: {
            name: user.name,
            type: 'INDEPENDANT',
            userId: user.id,
            email: user.email,
            phone: user.phone || null,
            contact: user.name,
          }
        })
        logger.debug("✅ Partenaire créé automatiquement pour l'utilisateur existant:", user.name)
      } catch (partnerError: any) {
        logger.error("❌ Erreur lors de la création automatique du partenaire:", partnerError)
        return NextResponse.json({ error: 'Erreur lors de la création du partenaire' }, { status: 500 })
      }
    }

    // Vérifier que tous les œuvres existent et sont disponibles
    const workIds = items.map((item: any) => item.workId)
    const works = await prisma.work.findMany({
      where: {
        id: { in: workIds },
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        stock: true,
        price: true
      }
    })

    if (works.length !== workIds.length) {
      return NextResponse.json({ 
        error: 'Certaines œuvres ne sont pas disponibles' 
      }, { status: 400 })
    }

    // Vérifier le stock disponible pour chaque article
    for (const item of items) {
      const work = works.find(w => w.id === item.workId)
      if (!work) {
        return NextResponse.json({ 
          error: `Œuvre ${item.workId} introuvable` 
        }, { status: 400 })
      }
      if (work.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Stock insuffisant pour "${work.title}". Disponible: ${work.stock}, Demandé: ${item.quantity}` 
        }, { status: 400 })
      }
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        partnerId: partner.id,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            workId: item.workId,
            quantity: item.quantity,
            price: item.price || 3000 // Prix par défaut
          }))
        }
      },
      include: {
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                discipline: {
                  select: {
                    name: true
                  }
                },
                author: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Créer une notification pour le PDG
    try {
      await prisma.notification.create({
        data: {
          userId: session.user.id, // Le PDG recevra la notification
          title: 'Nouvelle commande partenaire',
          message: `Le partenaire ${partner.name} a passé une nouvelle commande (${order.id})`,
          type: 'ORDER_CREATED',
          data: JSON.stringify({
            orderId: order.id,
            partnerId: partner.id,
            partnerName: partner.name
          })
        }
      })
    } catch (notificationError) {
      logger.warn('⚠️ Failed to create notification:', notificationError)
    }

    return NextResponse.json({
      order: {
        id: order.id,
        reference: order.id,
        status: order.status,
        total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        items: order.items.map(item => ({
          id: item.id,
          work: {
            id: item.work.id,
            title: item.work.title,
            isbn: item.work.isbn || 'N/A',
            discipline: item.work.discipline?.name || 'Non définie',
            author: item.work.author?.name || 'Auteur inconnu'
          },
          quantity: item.quantity,
          price: item.price
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      }
    }, { status: 201 })

  } catch (error: any) {
    logger.error('Erreur lors de la création de la commande:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

