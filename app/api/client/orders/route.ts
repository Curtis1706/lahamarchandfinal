import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "100") // Limite augmentée pour afficher plus de commandes
    const offset = parseInt(searchParams.get("offset") || "0")

    // Construire les filtres
    const where: any = { userId }
    if (status && status !== "all") {
      where.status = status.toUpperCase()
    }

    // Récupérer les commandes avec pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              work: {
                include: {
                  discipline: true,
                  author: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset
      }),
      prisma.order.count({ where })
    ])

    // Formater les données
    const formattedOrders = orders.map(order => {
      // Extraire l'adresse de livraison depuis paymentReference (JSON) si disponible
      let deliveryAddress = null
      if (order.paymentReference) {
        try {
          const parsed = JSON.parse(order.paymentReference)
          deliveryAddress = parsed.address || null
        } catch (e) {
          // Si ce n'est pas du JSON, utiliser la valeur telle quelle
          deliveryAddress = order.paymentReference
        }
      }

      return {
        id: order.id,
        date: order.createdAt,
        status: order.status,
        // Utiliser le total stocké dans la DB (qui inclut TVA) plutôt que recalculer
        total: order.total || order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: order.paymentMethod || null,
        paymentStatus: order.paymentStatus,
        deliveryAddress: deliveryAddress || null,
        deliveryStatus: order.deliveryStatus,
        receivedAt: order.receivedAt,
        receivedBy: order.receivedBy,
        paymentReference: order.paymentReference,
        items: order.items.map(item => {
          let coverImage = null
          if (item.work.files) {
            try {
              const filesData = typeof item.work.files === 'string' ? JSON.parse(item.work.files) : item.work.files
              coverImage = filesData.coverImage || null
            } catch (e) {
              console.error("Error parsing work files:", e)
            }
          }

          return {
            id: item.id,
            title: item.work.title,
            author: item.work.author?.name,
            discipline: item.work.discipline.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            isbn: item.work.isbn,
            image: coverImage,
            workId: item.workId,
            work: item.work
          }
        })
      }
    })

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    logger.error("Error fetching client orders:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PATCH - Modifier une commande (ex: annuler)
export async function PATCH(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { orderId, action, status } = body

    // Validation
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Vérifier que la commande existe et appartient à l'utilisateur
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Traiter l'action "confirm_reception"
    if (action === "confirm_reception") {
      // Seules les commandes DELIVERED peuvent être réceptionnées
      if (existingOrder.status !== OrderStatus.DELIVERED) {
        return NextResponse.json({
          error: "Seules les commandes livrées peuvent être confirmées comme reçues"
        }, { status: 400 })
      }

      // Mettre à jour la date de réception et le statut de livraison
      logger.info(`Confirming reception for order ${orderId} by user ${session.user.id}`);
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          receivedAt: new Date(),
          receivedBy: session.user.name || session.user.email || "Client",
          deliveryStatus: 'RECEIVED'
        },
        include: {
          items: {
            include: {
              work: {
                include: {
                  discipline: true,
                  author: { select: { name: true } }
                }
              }
            }
          }
        }
      })

      // Formater la réponse (réutiliser la logique existante)
      let deliveryAddress = null
      if (updatedOrder.paymentReference) {
        try {
          const parsed = JSON.parse(updatedOrder.paymentReference)
          deliveryAddress = parsed.address || null
        } catch (e) {
          deliveryAddress = updatedOrder.paymentReference
        }
      }

      return NextResponse.json({
        id: updatedOrder.id,
        date: updatedOrder.createdAt,
        status: updatedOrder.status,
        total: updatedOrder.total || updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemsCount: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: updatedOrder.paymentMethod || null,
        deliveryAddress: deliveryAddress || null,
        receivedAt: updatedOrder.receivedAt,
        receivedBy: updatedOrder.receivedBy,
        paymentReference: updatedOrder.paymentReference,
        items: updatedOrder.items.map(item => {
          let coverImage = null
          if (item.work.files) {
            try {
              const filesData = typeof item.work.files === 'string' ? JSON.parse(item.work.files) : item.work.files
              coverImage = filesData.coverImage || null
            } catch (e) {
              console.error("Error parsing work files:", e)
            }
          }

          return {
            id: item.id,
            title: item.work.title,
            author: item.work.author?.name,
            discipline: item.work.discipline.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            isbn: item.work.isbn,
            image: coverImage,
            workId: item.workId
          }
        })
      })
    }

    if (action === "submit_payment_proof") {
      const { transactionId, paymentProof } = body;

      if (!transactionId) {
        return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
      }

      // Retrieve existing payment reference to preserve other data (address, etc.)
      let currentRef = {};
      try {
        if (existingOrder.paymentReference) {
          currentRef = JSON.parse(existingOrder.paymentReference);
        }
      } catch (e) {
        // If not JSON, we might lose old string data, but usually it's JSON now
        logger.warn(`Could not parse existing payment reference for order ${orderId}`);
      }

      const updatedRef = {
        ...currentRef,
        transactionId,
        paymentProof,
        submittedAt: new Date().toISOString()
      };

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentReference: JSON.stringify(updatedRef),
          // We don't change paymentStatus to PAID yet, the PDG must confirm
          // But we can rely on the presence of transactionId in UI to show "Pending"
        },
        include: {
          items: {
            include: {
              work: {
                include: {
                  discipline: true,
                  author: { select: { name: true } }
                }
              }
            }
          }
        }
      });

      // Format response (reuse logic)
      let deliveryAddress = null;
      try {
        const parsed = JSON.parse(updatedOrder.paymentReference || "{}");
        deliveryAddress = parsed.address || null;
      } catch (e) {
        deliveryAddress = updatedOrder.paymentReference;
      }

      return NextResponse.json({
        id: updatedOrder.id,
        date: updatedOrder.createdAt,
        status: updatedOrder.status,
        total: updatedOrder.total,
        itemsCount: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: updatedOrder.paymentMethod || null,
        deliveryAddress: deliveryAddress || null,
        paymentReference: updatedOrder.paymentReference,
        items: [] // Simplified for response
      });
    }

    // Traiter l'action "cancel" ou le changement de statut directement
    if (action === "cancel" || status === "CANCELLED") {
      // Seules les commandes PENDING peuvent être annulées
      if (existingOrder.status !== OrderStatus.PENDING) {
        return NextResponse.json({
          error: "Seules les commandes en attente peuvent être annulées"
        }, { status: 400 })
      }

      // Mettre à jour le statut
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: {
          items: {
            include: {
              work: {
                include: {
                  discipline: true,
                  author: { select: { name: true } }
                }
              }
            }
          },
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Formater la réponse
      let deliveryAddress = null
      if (updatedOrder.paymentReference) {
        try {
          const parsed = JSON.parse(updatedOrder.paymentReference)
          deliveryAddress = parsed.address || null
        } catch (e) {
          deliveryAddress = updatedOrder.paymentReference
        }
      }

      const formattedOrder = {
        id: updatedOrder.id,
        date: updatedOrder.createdAt,
        status: updatedOrder.status,
        total: updatedOrder.total || updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemsCount: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: updatedOrder.paymentMethod || null,
        deliveryAddress: deliveryAddress || null,
        items: updatedOrder.items.map(item => {
          let coverImage = null
          if (item.work.files) {
            try {
              const filesData = typeof item.work.files === 'string' ? JSON.parse(item.work.files) : item.work.files
              coverImage = filesData.coverImage || null
            } catch (e) {
              console.error("Error parsing work files:", e)
            }
          }

          return {
            id: item.id,
            title: item.work.title,
            author: item.work.author?.name,
            discipline: item.work.discipline.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            isbn: item.work.isbn,
            image: coverImage,
            workId: item.workId
          }
        }),
        paymentReference: updatedOrder.paymentReference
      }

      return NextResponse.json(formattedOrder)
    }

    // Si un statut est fourni directement (sans action)
    if (status && status !== "CANCELLED") {
      // Valider les transitions de statut (seul CANCELLED est autorisé pour les clients)
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.CANCELLED],
        [OrderStatus.VALIDATED]: [],
        [OrderStatus.PROCESSING]: [],
        [OrderStatus.SHIPPED]: [],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: []
      }

      if (!validTransitions[existingOrder.status].includes(status as OrderStatus)) {
        return NextResponse.json({
          error: `Impossible de changer le statut de ${existingOrder.status} à ${status}`
        }, { status: 400 })
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: status as OrderStatus },
        include: {
          items: {
            include: {
              work: {
                include: {
                  discipline: true,
                  author: { select: { name: true } }
                }
              }
            }
          }
        }
      })

      let deliveryAddress = null
      if (updatedOrder.paymentReference) {
        try {
          const parsed = JSON.parse(updatedOrder.paymentReference)
          deliveryAddress = parsed.address || null
        } catch (e) {
          deliveryAddress = updatedOrder.paymentReference
        }
      }

      return NextResponse.json({
        id: updatedOrder.id,
        date: updatedOrder.createdAt,
        status: updatedOrder.status,
        total: updatedOrder.total || updatedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemsCount: updatedOrder.items.reduce((sum, item) => sum + item.quantity, 0),
        paymentMethod: updatedOrder.paymentMethod || null,
        deliveryAddress: deliveryAddress || null,
        items: updatedOrder.items.map(item => {
          let coverImage = null
          if (item.work.files) {
            try {
              const filesData = typeof item.work.files === 'string' ? JSON.parse(item.work.files) : item.work.files
              coverImage = filesData.coverImage || null
            } catch (e) {
              console.error("Error parsing work files:", e)
            }
          }

          return {
            id: item.id,
            title: item.work.title,
            author: item.work.author?.name,
            discipline: item.work.discipline.name,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            isbn: item.work.isbn,
            image: coverImage,
            workId: item.workId
          }
        }),
        paymentReference: updatedOrder.paymentReference
      })
    }

    return NextResponse.json({ error: "Invalid action or status" }, { status: 400 })

  } catch (error) {
    logger.error("Error updating order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
