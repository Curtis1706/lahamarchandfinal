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

// POST /api/representant/partner-orders - NON AUTORISÉ
// Le Représentant ne peut pas créer de commandes pour les partenaires
// Seul le partenaire peut créer ses propres commandes
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Non autorisé. Le Représentant ne peut pas créer de commandes pour les partenaires. Seul le partenaire peut créer ses propres commandes.' 
  }, { status: 403 })
}