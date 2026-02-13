import { logger } from '@/lib/logger'
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
        { reference: { contains: search, mode: 'insensitive' } }
        // La recherche dans order sera faite côté client ou via une requête séparée si nécessaire
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

    let deliveryNotes: any[] = []
    let total = 0

    try {
      // Essayer de récupérer les delivery notes avec toutes les relations
      try {
        [deliveryNotes, total] = await Promise.all([
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
          }),
          prisma.deliveryNote.count({ where })
        ])
      } catch (includeError: any) {
        logger.error('Error with includes, trying without relations:', includeError)
        // Si l'inclusion des relations échoue, essayer sans relations
        try {
          [deliveryNotes, total] = await Promise.all([
            prisma.deliveryNote.findMany({
              where,
              orderBy: { createdAt: 'desc' },
              take: limit,
              skip: skip
            }),
            prisma.deliveryNote.count({ where })
          ])
        } catch (simpleError: any) {
          logger.error('Error even without includes:', simpleError)
          // En dernier recours, retourner un tableau vide
          deliveryNotes = []
          total = 0
        }
      }
    } catch (dbError: any) {
      logger.error('Database error in bon-sortie GET:', dbError)
      logger.error('Error message:', dbError.message)
      logger.error('Error code:', dbError.code)

      // Pour toute erreur de base de données, retourner un tableau vide
      return NextResponse.json({
        deliveryNotes: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      })
    }

    // Mapper les delivery notes de manière sécurisée
    const mappedNotes = deliveryNotes.map(note => {
      try {
        // Calculer le total de la commande si nécessaire
        let orderTotal = 0
        let orderData: any = null

        if (note.order) {
          try {
            if (note.order.total && note.order.total > 0) {
              orderTotal = Number(note.order.total)
            } else if (note.order.items && Array.isArray(note.order.items) && note.order.items.length > 0) {
              orderTotal = note.order.items.reduce((sum: number, item: any) => {
                const price = Number(item.price || 0)
                const quantity = Number(item.quantity || 0)
                return sum + (price * quantity)
              }, 0)
            }

            orderData = {
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
                quantity: Number(item.quantity || 0),
                price: Number(item.price || 0)
              }))
            }
          } catch (orderError: any) {
            logger.error('Error processing order data:', orderError)
            orderData = {
              id: note.order?.id || '',
              reference: 'N/A',
              client: 'Client inconnu',
              clientEmail: '',
              partner: null,
              total: 0,
              status: 'UNKNOWN',
              items: []
            }
          }
        }

        return {
          id: note.id,
          reference: note.reference || 'N/A',
          order: orderData,
          generatedBy: note.generatedBy?.name || 'Utilisateur inconnu',
          validatedBy: note.validatedBy?.name || null,
          validatedAt: note.validatedAt ? (() => {
            try {
              return format(new Date(note.validatedAt), 'dd MMM yyyy, HH:mm', { locale: fr })
            } catch (e) {
              return note.validatedAt instanceof Date ? note.validatedAt.toISOString() : String(note.validatedAt)
            }
          })() : null,
          controlledBy: note.controlledBy?.name || null,
          controlledAt: note.controlledAt ? (() => {
            try {
              return format(new Date(note.controlledAt), 'dd MMM yyyy, HH:mm', { locale: fr })
            } catch (e) {
              return note.controlledAt instanceof Date ? note.controlledAt.toISOString() : String(note.controlledAt)
            }
          })() : null,
          status: note.status || 'UNKNOWN',
          period: note.period || null,
          createdAt: (() => {
            try {
              return format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })
            } catch (e) {
              return note.createdAt instanceof Date ? note.createdAt.toISOString() : String(note.createdAt)
            }
          })()
        }
      } catch (mapError: any) {
        logger.error('Error mapping delivery note:', mapError)
        logger.error('Note ID:', note?.id)
        logger.error('Note data:', JSON.stringify(note, null, 2))
        return {
          id: note?.id || 'unknown',
          reference: note?.reference || 'N/A',
          order: null,
          generatedBy: note?.generatedBy?.name || 'Utilisateur inconnu',
          validatedBy: null,
          validatedAt: null,
          controlledBy: null,
          controlledAt: null,
          status: note?.status || 'UNKNOWN',
          period: note?.period || null,
          createdAt: note?.createdAt ? (() => {
            try {
              return format(new Date(note.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })
            } catch (e) {
              return note.createdAt instanceof Date ? note.createdAt.toISOString() : String(note.createdAt)
            }
          })() : 'N/A'
        }
      }
    })

    return NextResponse.json({
      deliveryNotes: mappedNotes,
      pagination: {
        total: Number(total) || 0,
        page,
        limit,
        totalPages: Math.ceil((Number(total) || 0) / limit)
      }
    })
  } catch (error: any) {
    logger.error('Error fetching delivery notes:', error)
    logger.error('Error details:', error.message, error.stack)
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
    logger.error('Error creating delivery note:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du bon de sortie' },
      { status: 500 }
    )
  }
}

// PUT /api/pdg/bon-sortie - Mettre à jour un bon de sortie (validation, contrôle, annulation)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const {
      id,
      action,
      notes,
      // Nouveaux champs pour la validation
      motif,
      destination,
      etatLivres,
      transport,
      datePrevue
    } = body // action: 'validate' | 'control' | 'complete' | 'cancel'

    if (!id || !action) {
      return NextResponse.json({ error: 'ID et action requis' }, { status: 400 })
    }

    const deliveryNote = await prisma.deliveryNote.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: true
          }
        }
      }
    })

    if (!deliveryNote) {
      return NextResponse.json({ error: 'Bon de sortie introuvable' }, { status: 404 })
    }

    let result

    if (action === 'validate') {
      const updateData: any = {
        validatedById: session.user.id,
        validatedAt: new Date(),
        status: 'VALIDATED',
        motif,
        destination,
        etatLivres,
        transport,
        datePrevue: datePrevue ? new Date(datePrevue) : undefined
      }

      if (notes) updateData.notes = notes

      result = await prisma.deliveryNote.update({
        where: { id },
        data: updateData,
        include: {
          validatedBy: { select: { id: true, name: true } },
          controlledBy: { select: { id: true, name: true } }
        }
      })

    } else if (action === 'control') {
      if (deliveryNote.status !== 'VALIDATED') {
        return NextResponse.json({ error: 'Le bon doit être validé avant d\'être contrôlé' }, { status: 400 })
      }
      result = await prisma.deliveryNote.update({
        where: { id },
        data: {
          controlledById: session.user.id,
          controlledAt: new Date(),
          status: 'CONTROLLED',
          notes: notes || undefined
        },
        include: {
          validatedBy: { select: { id: true, name: true } },
          controlledBy: { select: { id: true, name: true } }
        }
      })

    } else if (action === 'complete') {
      if (deliveryNote.status !== 'CONTROLLED') {
        return NextResponse.json({ error: 'Le bon doit être contrôlé avant d\'être complété' }, { status: 400 })
      }
      result = await prisma.deliveryNote.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          notes: notes || undefined
        }
      })

    } else if (action === 'cancel') {
      // Annulation avec ré-incrémentation du stock
      result = await prisma.$transaction(async (tx) => {
        // 1. Mettre à jour le bon de sortie
        const updatedNote = await tx.deliveryNote.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            notes: notes || undefined
          },
          include: {
            validatedBy: { select: { id: true, name: true } },
            controlledBy: { select: { id: true, name: true } }
          }
        })

        // 2. Ré-incrémenter le stock pour chaque article
        // Uniquement si le bon n'était pas déjà annulé pour éviter les doublons
        if (deliveryNote.status !== 'CANCELLED') {
          for (const item of deliveryNote.order.items) {
            // Remettre en stock
            await tx.work.update({
              where: { id: item.workId },
              data: {
                stock: { increment: item.quantity },
                physicalStock: { increment: item.quantity }
              }
            })

            // Créer un mouvement de stock inverse (CORRECTION ou INBOUND)
            await tx.stockMovement.create({
              data: {
                workId: item.workId,
                type: 'CORRECTION', // Utiliser CORRECTION pour indiquer un retour suite à annulation
                quantity: item.quantity,
                reason: `Annulation Bon de Sortie ${deliveryNote.reference}`,
                reference: deliveryNote.reference,
                performedBy: session.user.id,
                isCorrection: true,
                correctionReason: 'Annulation Bon de Sortie'
              }
            })
          }
        }

        return updatedNote
      })
    } else {
      return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

    if (!result) {
      return NextResponse.json({ error: 'Erreur inattendue lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Bon de sortie mis à jour avec succès',
      deliveryNote: {
        id: result.id,
        reference: result.reference,
        status: result.status,
        validatedBy: (result as any).validatedBy?.name,
        controlledBy: (result as any).controlledBy?.name
      }
    })
  } catch (error: any) {
    logger.error('Error updating delivery note:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du bon de sortie' },
      { status: 500 }
    )
  }
}

