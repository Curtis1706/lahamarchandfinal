import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/representant/partner-orders - Récupérer les commandes des partenaires du représentant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Construire les filtres
    const where: any = {
      partner: {
        representantId: session.user.id
      }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (partnerId && partnerId !== 'all') {
      where.partnerId = partnerId
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
            contact: true
          }
        },
        items: {
          include: {
            work: {
              include: {
                discipline: {
                  select: {
                    id: true,
                    name: true
                  }
                },
                author: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formater les données
    const formattedOrders = orders.map(order => {
      const total = order.items.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      )

      return {
        id: order.id,
        reference: `2025COM${order.id.slice(-6).toUpperCase()}`,
        status: order.status,
        total,
        itemCount: order.items.length,
        partner: order.partner,
        client: order.user,
        items: order.items.map(item => ({
          id: item.id,
          work: {
            id: item.work.id,
            title: item.work.title,
            isbn: item.work.isbn,
            discipline: item.work.discipline.name,
            author: item.work.author?.name || "Auteur inconnu"
          },
          quantity: item.quantity,
          price: item.price
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      }
    })

    return NextResponse.json(formattedOrders)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des commandes partenaires:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/representant/partner-orders - Créer une commande pour un partenaire
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { partnerId, items, notes } = body

    if (!partnerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        error: 'ID partenaire et items requis' 
      }, { status: 400 })
    }

    // Vérifier que le partenaire appartient à ce représentant
    const partner = await prisma.partner.findFirst({
      where: {
        id: partnerId,
        representantId: session.user.id
      }
    })

    if (!partner) {
      return NextResponse.json({ 
        error: 'Partenaire non trouvé ou non autorisé' 
      }, { status: 404 })
    }

    // Vérifier que tous les items existent et sont disponibles
    for (const item of items) {
      const work = await prisma.work.findUnique({
        where: { id: item.workId }
      })

      if (!work) {
        return NextResponse.json({ 
          error: `Œuvre ${item.workId} introuvable` 
        }, { status: 400 })
      }

      if (work.status !== 'ON_SALE') {
        return NextResponse.json({ 
          error: `Œuvre ${work.title} n'est pas en vente` 
        }, { status: 400 })
      }

      if (work.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Stock insuffisant pour ${work.title} (disponible: ${work.stock})` 
        }, { status: 400 })
      }
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        userId: partner.userId, // L'utilisateur associé au partenaire
        partnerId: partner.id,
        status: 'PENDING', // En attente de validation PDG
        items: {
          create: items.map((item: any) => ({
            workId: item.workId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: {
          include: {
            work: {
              include: {
                discipline: true,
                author: true
              }
            }
          }
        },
        partner: true,
        user: true
      }
    })

    // Créer une notification pour le PDG
    try {
      const pdgUser = await prisma.user.findFirst({
        where: { role: 'PDG' }
      })

      if (pdgUser) {
        await prisma.notification.create({
          data: {
            userId: pdgUser.id,
            title: 'Nouvelle commande partenaire à valider',
            message: `Le représentant ${session.user.name} a créé une commande (${order.id}) pour le partenaire ${partner.name}`,
            type: 'ORDER_UPDATE',
            data: JSON.stringify({ 
              orderId: order.id, 
              representantId: session.user.id, 
              partnerId: partner.id,
              partnerName: partner.name,
              notes: notes || ''
            })
          }
        })
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to create notification:', notificationError)
    }

    // Formater la réponse
    const total = order.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    )

    const response = {
      order: {
        id: order.id,
        reference: `2025COM${order.id.slice(-6).toUpperCase()}`,
        status: order.status,
        total,
        itemCount: order.items.length,
        partner: {
          id: order.partner.id,
          name: order.partner.name,
          type: order.partner.type
        },
        items: order.items.map(item => ({
          id: item.id,
          work: {
            id: item.work.id,
            title: item.work.title,
            isbn: item.work.isbn,
            price: item.work.price,
            discipline: item.work.discipline.name,
            author: item.work.author?.name || "Auteur inconnu"
          },
          quantity: item.quantity,
          price: item.price
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      }
    }

    console.log(`✅ Commande partenaire créée: ${order.id} pour ${partner.name}`)
    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('❌ Erreur lors de la création de la commande partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}