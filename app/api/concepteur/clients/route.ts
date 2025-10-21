import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/concepteur/clients - Récupérer les clients du concepteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Construire les filtres
    const where: any = {
      role: 'CLIENT',
      orders: {
        some: {
          items: {
            some: {
              work: {
                concepteurId: session.user.id
              }
            }
          }
        }
      }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const clients = await prisma.user.findMany({
      where,
      include: {
        orders: {
          where: {
            items: {
              some: {
                work: {
                  concepteurId: session.user.id
                }
              }
            }
          },
          include: {
            items: {
              where: {
                work: {
                  concepteurId: session.user.id
                }
              },
              include: {
                work: {
                  select: {
                    id: true,
                    title: true,
                    price: true
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
    const formattedClients = clients.map(client => {
      const totalOrders = client.orders.length
      const totalSpent = client.orders.reduce((sum, order) => {
        return sum + order.items.reduce((orderSum, item) => {
          return orderSum + (item.price * item.quantity)
        }, 0)
      }, 0)

      const lastOrder = client.orders.length > 0 
        ? client.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        type: 'Client', // Type par défaut
        department: 'ATLANTIQUE', // Département par défaut
        status: client.status,
        totalOrders,
        totalSpent,
        lastOrder: lastOrder ? {
          id: lastOrder.id,
          date: lastOrder.createdAt.toISOString(),
          amount: lastOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        } : null,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString()
      }
    })

    return NextResponse.json(formattedClients)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des clients:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/concepteur/clients - Créer un nouveau client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, type, address, city, notes } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 })
    }

    // Vérifier que l'email n'existe pas déjà
    const existingClient = await prisma.user.findUnique({
      where: { email }
    })

    if (existingClient) {
      return NextResponse.json({ error: 'Un client avec cet email existe déjà' }, { status: 400 })
    }

    // Créer le client
    const client = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || '',
        password: 'temp_password', // Mot de passe temporaire
        role: 'CLIENT',
        status: 'ACTIVE',
        emailVerified: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true
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
            title: 'Nouveau client créé',
            message: `Le concepteur ${session.user.name} a créé un nouveau client: ${client.name}`,
            type: 'CLIENT_CREATED',
            data: JSON.stringify({ 
              clientId: client.id, 
              concepteurId: session.user.id,
              clientName: client.name,
              clientEmail: client.email
            })
          }
        })
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to create notification:', notificationError)
    }

    const response = {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        type: type || 'Client',
        department: 'ATLANTIQUE',
        status: client.status,
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: null,
        createdAt: client.createdAt.toISOString()
      }
    }

    console.log('✅ Client created by concepteur:', client.id)

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de la création du client:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
