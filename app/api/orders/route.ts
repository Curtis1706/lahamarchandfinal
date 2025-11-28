import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { calculatePartnerRebate, calculateAuthorRoyalty } from "@/lib/rebate-calculator"

// GET /api/orders - Liste des commandes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {}
    
    if (status && status !== 'all') {
      whereClause.status = status as OrderStatus
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                price: true,
                discipline: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Calculer le total pour chaque commande
    const ordersWithTotal = orders.map(order => ({
      ...order,
      total: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      bookCount: order.items.reduce((sum, item) => sum + item.quantity, 0)
    }))

    return NextResponse.json(ordersWithTotal)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/orders - Créer une commande
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, partnerId, items } = body

    if (!userId || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculer le total de la commande
    let subtotal = 0
    for (const item of items) {
      const work = await prisma.work.findUnique({
        where: { id: item.workId },
        select: { price: true }
      })
      const itemPrice = item.price || work?.price || 0
      subtotal += itemPrice * item.quantity
    }
    
    const tax = subtotal * 0.18 // TVA à 18%
    const total = subtotal + tax

    const newOrder = await prisma.order.create({
      data: {
        userId,
        partnerId: partnerId || null,
        subtotal,
        tax,
        total,
        items: {
          create: items.map((item: any) => ({
            workId: item.workId,
            quantity: item.quantity,
            price: item.price || 0
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                price: true,
                discipline: {
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

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/orders - Mettre à jour une commande
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { id, status, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        updatedAt: new Date(),
        ...updateData
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            work: {
              select: {
                id: true,
                title: true,
                price: true,
                stock: true,
                physicalStock: true,
                discipline: {
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

    // 🔹 Créer automatiquement un Bon de Sortie et réduire le stock si la commande est validée
    if (status === "VALIDATED") {
      try {
        // Vérifier qu'un bon de sortie n'existe pas déjà
        const existingDeliveryNote = await prisma.deliveryNote.findUnique({
          where: { orderId: id }
        })

        if (!existingDeliveryNote) {
          // Récupérer l'ID de l'utilisateur (PDG ou utilisateur de la session)
          let userId = session?.user?.id
          if (!userId) {
            // Si pas de session, trouver le PDG
            const pdg = await prisma.user.findFirst({
              where: { role: 'PDG' },
              select: { id: true }
            })
            if (pdg) {
              userId = pdg.id
            } else {
              throw new Error("Aucun utilisateur PDG trouvé pour créer le bon de sortie")
            }
          }

          // Utiliser une transaction pour garantir la cohérence
          await prisma.$transaction(async (tx) => {
            // 1. Générer une référence unique pour le bon de sortie
            const year = new Date().getFullYear()
            const count = await tx.deliveryNote.count({
              where: {
                reference: {
                  startsWith: `BS-${year}-`
                }
              }
            })
            const reference = `BS-${year}-${String(count + 1).padStart(4, '0')}`

            // 2. Créer le bon de sortie
            const deliveryNote = await tx.deliveryNote.create({
              data: {
                reference,
                orderId: id,
                generatedById: userId,
                status: 'PENDING'
              }
            })

            // 3. Réduire le stock pour chaque item et créer des mouvements de stock
            for (const item of updatedOrder.items) {
              const work = item.work
              const quantity = item.quantity

              // Vérifier que le stock est suffisant
              if (work.stock < quantity) {
                throw new Error(
                  `Stock insuffisant pour "${work.title}". Disponible: ${work.stock}, Demandé: ${quantity}`
                )
              }

              // Réduire le stock
              const updatedWork = await tx.work.update({
                where: { id: work.id },
                data: {
                  stock: {
                    decrement: quantity
                  },
                  physicalStock: {
                    decrement: quantity
                  }
                },
                select: {
                  stock: true,
                  physicalStock: true
                }
              })

              // Créer un mouvement de stock pour tracer l'historique
              await tx.stockMovement.create({
                data: {
                  workId: work.id,
                  type: 'OUTBOUND',
                  quantity: -quantity, // Négatif car c'est une sortie
                  reason: `Bon de sortie ${reference} - Commande ${id}`,
                  reference: reference,
                  performedBy: userId,
                  partnerId: updatedOrder.partnerId || null,
                  unitPrice: item.price,
                  totalAmount: item.price * quantity
                }
              })
            }
          })
        }

        // 🔹 Calculer automatiquement les ristournes si la commande est validée
        try {
          // Calculer les ristournes partenaires si c'est une commande partenaire
          if (updatedOrder.partnerId && updatedOrder.partner) {
            const totalAmount = updatedOrder.total || updatedOrder.subtotal || 0
            const { amount, rate } = await calculatePartnerRebate(
              id,
              updatedOrder.partnerId,
              totalAmount
            )

            // Vérifier si une ristourne existe déjà
            const existingRebate = await prisma.partnerRebate.findFirst({
              where: {
                orderId: id,
                partnerId: updatedOrder.partnerId
              }
            })

            if (!existingRebate) {
              await prisma.partnerRebate.create({
                data: {
                  partnerId: updatedOrder.partnerId,
                  orderId: id,
                  amount,
                  rate,
                  status: 'PENDING'
                }
              })
            }
          }

          // Calculer les droits d'auteur pour chaque item
          for (const item of updatedOrder.items) {
            const work = item.work
            if (!work) continue

            // Récupérer l'auteur de l'œuvre
            const workWithAuthor = await prisma.work.findUnique({
              where: { id: work.id },
              select: { authorId: true }
            })

            if (!workWithAuthor?.authorId) continue

            const saleAmount = item.price * item.quantity
            const { amount, rate } = await calculateAuthorRoyalty(
              work.id,
              workWithAuthor.authorId,
              saleAmount
            )

            // Vérifier si une royalty existe déjà
            const existingRoyalty = await prisma.royalty.findFirst({
              where: {
                orderId: id,
                workId: work.id,
                userId: workWithAuthor.authorId
              }
            })

            if (!existingRoyalty) {
              await prisma.royalty.create({
                data: {
                  workId: work.id,
                  userId: workWithAuthor.authorId,
                  orderId: id,
                  amount,
                  rate,
                  paid: false
                }
              })
            }
          }
        } catch (rebateError: any) {
          console.error("❌ Error calculating rebates:", rebateError)
          console.warn("⚠️ Order validated but rebate calculation failed:", rebateError.message)
        }
      } catch (deliveryNoteError: any) {
        console.error("❌❌ Error creating delivery note or reducing stock:", deliveryNoteError)
        console.error("❌❌ Error stack:", deliveryNoteError.stack)
        // Ne pas faire échouer la validation si la création du bon échoue
        // Mais on log l'erreur pour investigation
        console.warn("⚠️⚠️ Order validated but delivery note creation failed:", deliveryNoteError.message)
      }
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/orders - Supprimer une commande
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Vérifier si la commande existe
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Supprimer d'abord les items de la commande
    await prisma.orderItem.deleteMany({
      where: { orderId }
    })

    // Puis supprimer la commande
    await prisma.order.delete({
      where: { id: orderId }
    })

    return NextResponse.json({ message: "Order deleted successfully" })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
