import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/pdg/stock/demande - Récupérer les demandes de stock
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const method = searchParams.get('method')
    const period = searchParams.get('period')
    const date = searchParams.get('date')
    const accountType = searchParams.get('accountType')
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit

    // Construire les conditions de filtre
    const where: any = {}

    if (status && status !== 'tous-statuts') {
      where.status = status.toUpperCase()
    }

    if (type && type !== 'tous-types') {
      where.type = type.toUpperCase()
    }

    if (method && method !== 'toutes-methodes') {
      where.method = method
    }

    if (period && period !== 'toutes') {
      where.period = period
    }

    if (date) {
      const dateObj = new Date(date)
      where.createdAt = {
        gte: dateObj,
        lt: new Date(dateObj.setDate(dateObj.getDate() + 1))
      }
    }

    if (userId && userId !== 'tous') {
      where.requestedById = userId
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [requests, total] = await Promise.all([
      prisma.stockRequest.findMany({
        where,
        include: {
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          order: {
            select: {
              id: true,
              status: true
            }
          },
          items: {
            include: {
              work: {
                select: {
                  id: true,
                  title: true,
                  isbn: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.stockRequest.count({ where })
    ])

    return NextResponse.json({
      requests: requests.map(req => ({
        id: req.id,
        reference: req.reference,
        nombreLivres: req.items.reduce((sum, item) => sum + item.quantity, 0),
        demandePar: req.requestedBy.name,
        faitLe: format(req.createdAt, 'dd MMM yyyy, HH:mm', { locale: fr }),
        dateLivraison: req.deliveryDate ? format(req.deliveryDate, 'dd MMM yyyy', { locale: fr }) : null,
        type: req.type,
        statut: req.status,
        livraison: req.status === 'DELIVERED' ? 'Livré' : req.status === 'PROCESSING' ? 'En cours' : 'En attente',
        departement: req.departmentId || '-',
        zone: req.zoneId || '-',
        commande: req.order ? `CMD-${req.order.id.slice(-8)}` : '-',
        method: req.method || '-',
        period: req.period || '-',
        items: req.items.map(item => ({
          work: item.work.title,
          isbn: item.work.isbn,
          quantity: item.quantity,
          approvedQuantity: item.approvedQuantity
        })),
        approvedBy: req.approvedBy?.name || null,
        approvedAt: req.approvedAt ? format(req.approvedAt, 'dd MMM yyyy, HH:mm', { locale: fr }) : null
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.error('Error fetching stock requests:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des demandes de stock' },
      { status: 500 }
    )
  }
}

// POST /api/pdg/stock/demande - Créer une demande de stock
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { type, method, period, deliveryDate, departmentId, zoneId, orderId, notes, items } = body

    if (!type || !items || items.length === 0) {
      return NextResponse.json({ error: 'Type et articles requis' }, { status: 400 })
    }

    // Générer une référence unique
    const year = new Date().getFullYear()
    const count = await prisma.stockRequest.count({
      where: {
        reference: {
          startsWith: `DS-${year}-`
        }
      }
    })
    const reference = `DS-${year}-${String(count + 1).padStart(4, '0')}`

    // Créer la demande avec ses articles
    const stockRequest = await prisma.stockRequest.create({
      data: {
        reference,
        requestedById: session.user.id,
        type: type.toUpperCase(),
        method: method || null,
        period: period || null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        departmentId: departmentId || null,
        zoneId: zoneId || null,
        orderId: orderId || null,
        notes: notes || null,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            workId: item.workId,
            quantity: item.quantity
          }))
        }
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                isbn: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Demande de stock créée avec succès',
      request: {
        id: stockRequest.id,
        reference: stockRequest.reference,
        status: stockRequest.status,
        createdAt: format(stockRequest.createdAt, 'dd MMM yyyy, HH:mm', { locale: fr })
      }
    })
  } catch (error: any) {
    logger.error('Error creating stock request:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la demande de stock' },
      { status: 500 }
    )
  }
}

// PUT /api/pdg/stock/demande - Approuver/Rejeter une demande
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, action, approvedQuantities } = body // action: 'approve' | 'reject'

    if (!id || !action) {
      return NextResponse.json({ error: 'ID et action requis' }, { status: 400 })
    }

    const stockRequest = await prisma.stockRequest.findUnique({
      where: { id },
      include: {
        items: true
      }
    })

    if (!stockRequest) {
      return NextResponse.json({ error: 'Demande de stock introuvable' }, { status: 404 })
    }

    let updateData: any = {}

    if (action === 'approve') {
      updateData = {
        approvedById: session.user.id,
        approvedAt: new Date(),
        status: 'APPROVED'
      }

      // Mettre à jour les quantités approuvées si fournies
      if (approvedQuantities && Array.isArray(approvedQuantities)) {
        await Promise.all(
          approvedQuantities.map(async (item: { itemId: string; quantity: number }) => {
            await prisma.stockRequestItem.update({
              where: { id: item.itemId },
              data: { approvedQuantity: item.quantity }
            })
          })
        )
      }
    } else if (action === 'reject') {
      updateData = {
        status: 'REJECTED'
      }
    } else if (action === 'process') {
      if (stockRequest.status !== 'APPROVED') {
        return NextResponse.json({ error: 'La demande doit être approuvée avant traitement' }, { status: 400 })
      }
      updateData = {
        status: 'PROCESSING'
      }
    } else if (action === 'deliver') {
      if (stockRequest.status !== 'PROCESSING') {
        return NextResponse.json({ error: 'La demande doit être en cours de traitement' }, { status: 400 })
      }
      updateData = {
        status: 'DELIVERED'
      }
    }

    const updated = await prisma.stockRequest.update({
      where: { id },
      data: updateData,
      include: {
        approvedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Demande de stock mise à jour avec succès',
      request: {
        id: updated.id,
        reference: updated.reference,
        status: updated.status
      }
    })
  } catch (error: any) {
    logger.error('Error updating stock request:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour de la demande de stock' },
      { status: 500 }
    )
  }
}

