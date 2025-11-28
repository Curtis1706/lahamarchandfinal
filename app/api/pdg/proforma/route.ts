import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/pdg/proforma - Récupérer les proformas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { partner: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [proformas, total] = await Promise.all([
      prisma.proforma.findMany({
        where,
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true
            }
          },
          createdBy: {
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
                  isbn: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.proforma.count({ where })
    ])

    const formattedProformas = proformas.map(proforma => ({
      id: proforma.id,
      reference: proforma.reference,
      partner: proforma.partner ? {
        id: proforma.partner.id,
        name: proforma.partner.name,
        email: proforma.partner.email,
        phone: proforma.partner.phone
      } : null,
      client: proforma.user ? {
        id: proforma.user.id,
        name: proforma.user.name,
        email: proforma.user.email,
        phone: proforma.user.phone,
        role: proforma.user.role
      } : null,
      items: proforma.items.map(item => ({
        id: item.id,
        work: {
          id: item.work.id,
          title: item.work.title,
          isbn: item.work.isbn,
          price: item.work.price
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total
      })),
      subtotal: proforma.subtotal,
      discount: proforma.discount,
      discountPercent: proforma.discountPercent,
      tax: proforma.tax,
      total: proforma.total,
      status: proforma.status,
      notes: proforma.notes,
      deliveryZone: proforma.deliveryZone,
      sentAt: proforma.sentAt ? format(proforma.sentAt, 'dd MMM yyyy, HH:mm', { locale: fr }) : null,
      respondedAt: proforma.respondedAt ? format(proforma.respondedAt, 'dd MMM yyyy, HH:mm', { locale: fr }) : null,
      convertedToOrderId: proforma.convertedToOrderId,
      version: proforma.version,
      createdBy: {
        id: proforma.createdBy.id,
        name: proforma.createdBy.name,
        email: proforma.createdBy.email
      },
      createdAt: format(proforma.createdAt, 'dd MMM yyyy, HH:mm', { locale: fr })
    }))

    return NextResponse.json({
      proformas: formattedProformas,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Error fetching proformas:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des proformas',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/pdg/proforma - Créer un nouveau proforma
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      partnerId, 
      userId, 
      items, 
      discount, 
      discountPercent, 
      notes, 
      deliveryZone 
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Au moins un produit est requis' }, { status: 400 })
    }

    if (!partnerId && !userId) {
      return NextResponse.json({ error: 'Un partenaire ou un client doit être sélectionné' }, { status: 400 })
    }

    // Vérifier que les œuvres existent
    const workIds = items.map((item: any) => item.workId)
    const works = await prisma.work.findMany({
      where: {
        id: { in: workIds },
        status: 'PUBLISHED'
      }
    })

    if (works.length !== workIds.length) {
      return NextResponse.json({ error: 'Certaines œuvres ne sont pas disponibles' }, { status: 400 })
    }

    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Générer une référence unique
      const year = new Date().getFullYear()
      const count = await tx.proforma.count({
        where: {
          reference: {
            startsWith: `PF-${year}-`
          }
        }
      })
      const reference = `PF-${year}-${String(count + 1).padStart(5, '0')}`

      // Calculer les totaux
      let subtotal = 0
      const proformaItems = items.map((item: any) => {
        const work = works.find(w => w.id === item.workId)
        if (!work) throw new Error(`Œuvre ${item.workId} introuvable`)

        const unitPrice = item.unitPrice || work.price
        const quantity = item.quantity
        const itemDiscount = item.discount || 0
        const itemTotal = (unitPrice * quantity) - itemDiscount

        subtotal += itemTotal

        return {
          workId: work.id,
          quantity,
          unitPrice,
          discount: itemDiscount,
          total: itemTotal
        }
      })

      // Calculer la remise globale
      const globalDiscount = discount || (discountPercent ? (subtotal * discountPercent / 100) : 0)
      const finalSubtotal = subtotal - globalDiscount
      const tax = finalSubtotal * 0.18 // TVA de 18%
      const total = finalSubtotal + tax

      // Créer le proforma
      const proforma = await tx.proforma.create({
        data: {
          reference,
          partnerId: partnerId || null,
          userId: userId || null,
          createdById: session.user.id,
          subtotal: finalSubtotal,
          discount: globalDiscount,
          discountPercent: discountPercent || null,
          tax,
          total,
          status: 'PENDING',
          notes: notes || null,
          deliveryZone: deliveryZone || null,
          items: {
            create: proformaItems
          }
        },
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
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

      return proforma
    })

    return NextResponse.json({
      message: 'Proforma créé avec succès',
      proforma: {
        id: result.id,
        reference: result.reference,
        total: result.total,
        status: result.status,
        createdAt: format(result.createdAt, 'dd MMM yyyy, HH:mm', { locale: fr })
      }
    })

  } catch (error: any) {
    console.error('Error creating proforma:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du proforma',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// PUT /api/pdg/proforma - Mettre à jour un proforma (envoyer, convertir en commande, etc.)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, action, ...updateData } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'ID et action requis' }, { status: 400 })
    }

    const proforma = await prisma.proforma.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            work: true
          }
        },
        partner: true,
        user: true
      }
    })

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma introuvable' }, { status: 404 })
    }

    let updatedProforma

    switch (action) {
      case 'send':
        // Envoyer le proforma au partenaire
        updatedProforma = await prisma.proforma.update({
          where: { id },
          data: {
            status: 'SENT',
            sentAt: new Date()
          },
          include: {
            partner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })

        // TODO: Envoyer une notification/email au partenaire
        return NextResponse.json({
          message: 'Proforma envoyé avec succès',
          proforma: updatedProforma
        })

      case 'convert':
        // Convertir le proforma en commande
        if (proforma.status !== 'ACCEPTED') {
          return NextResponse.json({ 
            error: 'Le proforma doit être accepté avant d\'être converti en commande' 
          }, { status: 400 })
        }

        const order = await prisma.$transaction(async (tx) => {
          // Créer la commande
          const newOrder = await tx.order.create({
            data: {
              userId: proforma.userId || proforma.partner?.userId || '',
              partnerId: proforma.partnerId || null,
              status: 'PENDING',
              subtotal: proforma.subtotal,
              tax: proforma.tax,
              total: proforma.total,
              items: {
                create: proforma.items.map(item => ({
                  workId: item.workId,
                  quantity: item.quantity,
                  price: item.unitPrice
                }))
              }
            }
          })

          // Mettre à jour le proforma
          await tx.proforma.update({
            where: { id },
            data: {
              status: 'CONVERTED',
              convertedToOrderId: newOrder.id
            }
          })

          return newOrder
        })

        return NextResponse.json({
          message: 'Proforma converti en commande avec succès',
          orderId: order.id
        })

      case 'accept':
        // Marquer le proforma comme accepté (simulation de la réponse du partenaire)
        updatedProforma = await prisma.proforma.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            respondedAt: new Date()
          }
        })

        return NextResponse.json({
          message: 'Proforma accepté',
          proforma: updatedProforma
        })

      case 'reject':
        // Marquer le proforma comme rejeté
        updatedProforma = await prisma.proforma.update({
          where: { id },
          data: {
            status: 'REJECTED',
            respondedAt: new Date(),
            notes: updateData.reason || proforma.notes
          }
        })

        return NextResponse.json({
          message: 'Proforma rejeté',
          proforma: updatedProforma
        })

      case 'update':
        // Mettre à jour le proforma (créer une nouvelle version)
        // TODO: Implémenter la logique de versioning
        return NextResponse.json({ error: 'Mise à jour non implémentée' }, { status: 501 })

      case 'cancel':
        // Annuler le proforma
        updatedProforma = await prisma.proforma.update({
          where: { id },
          data: {
            status: 'CANCELLED'
          }
        })

        return NextResponse.json({
          message: 'Proforma annulé',
          proforma: updatedProforma
        })

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error updating proforma:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour du proforma',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE /api/pdg/proforma - Supprimer un proforma
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const proforma = await prisma.proforma.findUnique({
      where: { id }
    })

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma introuvable' }, { status: 404 })
    }

    if (proforma.status === 'CONVERTED') {
      return NextResponse.json({ 
        error: 'Impossible de supprimer un proforma converti en commande' 
      }, { status: 400 })
    }

    await prisma.proforma.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Proforma supprimé avec succès' })

  } catch (error: any) {
    console.error('Error deleting proforma:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression du proforma',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

