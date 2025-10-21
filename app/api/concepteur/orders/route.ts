import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/concepteur/orders - Récupérer les commandes liées aux œuvres du concepteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Construire les filtres
    const where: any = {
      items: {
        some: {
          work: {
            concepteurId: session.user.id
          }
        }
      }
    }

    if (status && status !== 'all') {
      where.status = status
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

    // Formater les données pour le concepteur
    const formattedOrders = orders.map(order => {
      const concepteurItems = order.items.filter(item => 
        item.work.concepteurId === session.user.id
      )
      
      const total = concepteurItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      )

      return {
        id: order.id,
        reference: `2025COM${order.id.slice(-6).toUpperCase()}`,
        status: order.status,
        total,
        itemCount: concepteurItems.length,
        client: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone
        },
        items: concepteurItems.map(item => ({
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
    console.error('Erreur lors de la récupération des commandes:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/concepteur/orders - Créer une nouvelle commande pour un client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { clientId, items, notes } = body

    if (!clientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Client et items requis' }, { status: 400 })
    }

    // Vérifier que le client existe
    const client = await prisma.user.findUnique({
      where: { id: clientId, role: 'CLIENT' }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }

    // Vérifier que toutes les œuvres appartiennent au concepteur
    for (const item of items) {
      const work = await prisma.work.findUnique({
        where: { id: item.workId }
      })

      if (!work) {
        return NextResponse.json({ error: `Œuvre ${item.workId} introuvable` }, { status: 400 })
      }

      if (work.concepteurId !== session.user.id) {
        return NextResponse.json({ 
          error: `Vous n'êtes pas autorisé à vendre l'œuvre ${work.title}` 
        }, { status: 403 })
      }

      if (work.status !== 'PUBLISHED') {
        return NextResponse.json({ 
          error: `L'œuvre ${work.title} n'est pas disponible à la vente` 
        }, { status: 400 })
      }

      if (work.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Stock insuffisant pour ${work.title}` 
        }, { status: 400 })
      }
    }

    // Créer la commande
    const order = await prisma.order.create({
      data: {
        userId: clientId,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            workId: item.workId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
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
            title: 'Nouvelle commande à valider',
            message: `Le concepteur ${session.user.name} a créé une commande pour ${client.name}`,
            type: 'ORDER_UPDATE',
            data: JSON.stringify({ 
              orderId: order.id, 
              concepteurId: session.user.id, 
              clientId: client.id,
              notes 
            })
          }
        })
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to create notification:', notificationError)
    }

    const response = {
      order: {
        id: order.id,
        reference: `2025COM${order.id.slice(-6).toUpperCase()}`,
        status: order.status,
        total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: order.items.length,
        client: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email
        },
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
        createdAt: order.createdAt.toISOString()
      }
    }

    console.log('✅ Order created by concepteur:', order.id)

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de la création de la commande:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
