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

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
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
    console.error('Erreur lors de la récupération des commandes partenaire:', error)
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

    // Récupérer le partenaire associé à l'utilisateur
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Vérifier que tous les œuvres existent et sont disponibles
    const workIds = items.map((item: any) => item.workId)
    const works = await prisma.work.findMany({
      where: {
        id: { in: workIds },
        status: 'PUBLISHED'
      }
    })

    if (works.length !== workIds.length) {
      return NextResponse.json({ 
        error: 'Certaines œuvres ne sont pas disponibles' 
      }, { status: 400 })
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
      console.warn('⚠️ Failed to create notification:', notificationError)
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
    console.error('Erreur lors de la création de la commande:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

