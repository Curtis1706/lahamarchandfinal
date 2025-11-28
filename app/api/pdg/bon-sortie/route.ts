import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/pdg/bon-sortie - Récupérer les bons de sortie
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const orderType = searchParams.get('orderType')
    const period = searchParams.get('period')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Construire les conditions de filtre
    const where: any = {}

    if (status && status !== 'tous') {
      where.status = status.toUpperCase()
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { order: { id: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (period && period !== 'toutes') {
      where.period = period
    }

    // Filtrer par type de commande si nécessaire
    if (orderType && orderType !== 'toutes') {
      // Cette logique dépend de votre modèle Order
      // Pour l'instant, on peut filtrer par statut de commande
    }

    const [deliveryNotes, total] = await Promise.all([
      prisma.deliveryNote.findMany({
        where,
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              partner: {
                select: {
                  id: true,
                  name: true
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
          },
          generatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          validatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          controlledBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }).catch((error) => {
        console.error('Error in deliveryNote.findMany:', error)
        throw error
      }),
      prisma.deliveryNote.count({ where }).catch((error) => {
        console.error('Error in deliveryNote.count:', error)
        return 0
      })
    ])

    return NextResponse.json({
      deliveryNotes: deliveryNotes.map(note => {
        try {
          // Calculer le total de la commande si nécessaire
          let orderTotal = 0
          if (note.order) {
            if (note.order.total && note.order.total > 0) {
              orderTotal = note.order.total
            } else if (note.order.items && note.order.items.length > 0) {
              orderTotal = note.order.items.reduce((sum: number, item: any) => {
                return sum + ((item.price || 0) * (item.quantity || 0))
              }, 0)
            }
          }

          return {
            id: note.id,
            reference: note.reference,
            order: note.order ? {
              id: note.order.id || '',
              reference: note.order.id ? `CMD-${note.order.id.slice(-8)}` : 'N/A',
              client: note.order.user?.name || 'Client inconnu',
              clientEmail: note.order.user?.email || '',
              partner: note.order.partner?.name || null,
              total: orderTotal,
              status: note.order.status || 'UNKNOWN',
              items: (note.order.items || []).map((item: any) => ({
                work: item.work?.title || 'Œuvre inconnue',
                isbn: item.work?.isbn || 'N/A',
                quantity: item.quantity || 0,
                price: item.price || 0
              }))
            } : null,
            generatedBy: note.generatedBy?.name || 'Utilisateur inconnu',
            validatedBy: note.validatedBy?.name || null,
            validatedAt: note.validatedAt ? (() => {
              try {
                return format(new Date(note.validatedAt), 'dd MMM yyyy, HH:mm', { locale: fr })
              } catch (e) {
                return note.validatedAt.toISOString()
              }
            })() : null,
            controlledBy: note.controlledBy?.name || null,
            controlledAt: note.controlledAt ? (() => {
              try {
                return format(new Date(note.controlledAt), 'dd MMM yyyy, HH:mm', { locale: fr })
              } catch (e) {
                return note.controlledAt.toISOString()
              }
            })() : null,
            status: note.status,
            period: note.period || null,
            createdAt: (() => {
              try {
                return format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })
              } catch (e) {
                return note.createdAt.toISOString()
              }
            })()
          }
        } catch (mapError: any) {
          console.error('Error mapping delivery note:', mapError)
          console.error('Note ID:', note.id)
          return {
            id: note.id,
            reference: note.reference,
            order: null,
            generatedBy: note.generatedBy?.name || 'Utilisateur inconnu',
            validatedBy: null,
            validatedAt: null,
            controlledBy: null,
            controlledAt: null,
            status: note.status,
            period: note.period || null,
            createdAt: (() => {
              try {
                return format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })
              } catch (e) {
                return note.createdAt.toISOString()
              }
            })()
          }
        }
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching delivery notes:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des bons de sortie',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/pdg/bon-sortie - Créer un bon de sortie
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { orderId, period, notes } = body

    if (!orderId) {
      return NextResponse.json({ error: 'ID de commande requis' }, { status: 400 })
    }

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryNote: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    }

    // Vérifier qu'un bon de sortie n'existe pas déjà pour cette commande
    if (order.deliveryNote) {
      return NextResponse.json({ error: 'Un bon de sortie existe déjà pour cette commande' }, { status: 400 })
    }

    // Générer une référence unique
    const year = new Date().getFullYear()
    const count = await prisma.deliveryNote.count({
      where: {
        reference: {
          startsWith: `BS-${year}-`
        }
      }
    })
    const reference = `BS-${year}-${String(count + 1).padStart(4, '0')}`

    // Créer le bon de sortie
    const deliveryNote = await prisma.deliveryNote.create({
      data: {
        reference,
        orderId,
        generatedById: session.user.id,
        period: period || null,
        notes: notes || null,
        status: 'PENDING'
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            partner: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Bon de sortie créé avec succès',
      deliveryNote: {
        id: deliveryNote.id,
        reference: deliveryNote.reference,
        orderId: deliveryNote.orderId,
        status: deliveryNote.status,
        createdAt: format(deliveryNote.createdAt, 'dd MMM yyyy, HH:mm', { locale: fr })
      }
    })
  } catch (error: any) {
    console.error('Error creating delivery note:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du bon de sortie' },
      { status: 500 }
    )
  }
}

// PUT /api/pdg/bon-sortie - Mettre à jour un bon de sortie (validation, contrôle)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, action, notes } = body // action: 'validate' | 'control' | 'complete'

    if (!id || !action) {
      return NextResponse.json({ error: 'ID et action requis' }, { status: 400 })
    }

    const deliveryNote = await prisma.deliveryNote.findUnique({
      where: { id }
    })

    if (!deliveryNote) {
      return NextResponse.json({ error: 'Bon de sortie introuvable' }, { status: 404 })
    }

    let updateData: any = {}

    if (action === 'validate') {
      updateData = {
        validatedById: session.user.id,
        validatedAt: new Date(),
        status: 'VALIDATED'
      }
    } else if (action === 'control') {
      if (deliveryNote.status !== 'VALIDATED') {
        return NextResponse.json({ error: 'Le bon doit être validé avant d\'être contrôlé' }, { status: 400 })
      }
      updateData = {
        controlledById: session.user.id,
        controlledAt: new Date(),
        status: 'CONTROLLED'
      }
    } else if (action === 'complete') {
      if (deliveryNote.status !== 'CONTROLLED') {
        return NextResponse.json({ error: 'Le bon doit être contrôlé avant d\'être complété' }, { status: 400 })
      }
      updateData = {
        status: 'COMPLETED'
      }
    } else if (action === 'cancel') {
      updateData = {
        status: 'CANCELLED'
      }
    }

    if (notes) {
      updateData.notes = notes
    }

    const updated = await prisma.deliveryNote.update({
      where: { id },
      data: updateData,
      include: {
        validatedBy: {
          select: {
            id: true,
            name: true
          }
        },
        controlledBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Bon de sortie mis à jour avec succès',
      deliveryNote: {
        id: updated.id,
        reference: updated.reference,
        status: updated.status,
        validatedBy: updated.validatedBy?.name,
        controlledBy: updated.controlledBy?.name
      }
    })
  } catch (error: any) {
    console.error('Error updating delivery note:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du bon de sortie' },
      { status: 500 }
    )
  }
}

