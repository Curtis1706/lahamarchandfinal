import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from 'bcryptjs'

// POST /api/orders/guest - Créer une commande en tant qu'invité (sans authentification)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, deliveryInfo, paymentMethod, promoCode, discount } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Le panier est vide" }, { status: 400 })
    }

    if (!deliveryInfo || !deliveryInfo.fullName || !deliveryInfo.phone || !deliveryInfo.address) {
      return NextResponse.json({ error: "Les informations de livraison sont incomplètes" }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "La méthode de paiement est requise" }, { status: 400 })
    }

    // Vérifier que tous les items existent et sont disponibles
    const workIds = items.map((item: any) => item.workId)
    const worksInDb = await prisma.work.findMany({
      where: { 
        id: { in: workIds },
        status: { in: ['PUBLISHED', 'ON_SALE'] }
      },
      select: { id: true, title: true, stock: true, price: true, tva: true, status: true }
    })

    for (const item of items) {
      const work = worksInDb.find(w => w.id === item.workId)
      if (!work) {
        return NextResponse.json({ error: `Œuvre ${item.workId} introuvable` }, { status: 400 })
      }
      if (work.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Stock insuffisant pour ${work.title}. Disponible: ${work.stock}` 
        }, { status: 400 })
      }
    }

    // Calculer le total de la commande
    let subtotal = 0
    for (const item of items) {
      const work = worksInDb.find(w => w.id === item.workId)
      if (work) {
        const itemPrice = item.price || work.price || 0
        subtotal += itemPrice * item.quantity
      }
    }
    
    const tax = subtotal * 0.18 // TVA à 18%
    let total = subtotal + tax

    if (discount && discount > 0) {
      total -= discount
      if (total < 0) total = 0
    }

    // Créer ou trouver un utilisateur invité temporaire
    // Utiliser l'email ou créer un email temporaire basé sur le téléphone
    const guestEmail = deliveryInfo.email || `guest_${deliveryInfo.phone.replace(/\s+/g, '')}_${Date.now()}@guest.lahamarchand.com`
    
    let guestUser = await prisma.user.findUnique({
      where: { email: guestEmail }
    })
    
    if (!guestUser) {
      // Créer un utilisateur invité temporaire avec un mot de passe hashé aléatoire
      // Ce mot de passe ne peut pas être utilisé pour se connecter
      const randomPassword = Math.random().toString(36).slice(-20) + Math.random().toString(36).slice(-20)
      const hashedPassword = await bcrypt.hash(randomPassword, 12)
      
      guestUser = await prisma.user.create({
        data: {
          name: deliveryInfo.fullName,
          email: guestEmail,
          phone: deliveryInfo.phone,
          password: hashedPassword,
          role: "CLIENT", // Utiliser le rôle CLIENT pour les invités
          status: "ACTIVE"
        }
      })
    }

    // Créer la commande avec l'utilisateur invité
    const newOrder = await prisma.order.create({
      data: {
        userId: guestUser.id,
        subtotal,
        tax,
        discount: discount || 0,
        promoCode: promoCode || null,
        total,
        status: "PENDING",
        paymentMethod: paymentMethod,
        paymentReference: null,
        items: {
          create: items.map((item: any) => {
            const work = worksInDb.find(w => w.id === item.workId)!
            return {
              workId: item.workId,
              quantity: item.quantity,
              price: item.price || work.price || 0
            }
          })
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
        }
      }
    })

    // Stocker les informations de livraison dans les notes de la commande ou créer un enregistrement séparé
    // Pour simplifier, on peut stocker dans les notes
    await prisma.order.update({
      where: { id: newOrder.id },
      data: {
        // On peut utiliser un champ notes si disponible, sinon créer un modèle DeliveryInfo
        // Pour l'instant, on stocke dans un champ JSON si disponible
      }
    })

    // Créer une notification pour le PDG
    try {
      const pdgUser = await prisma.user.findFirst({ where: { role: "PDG" } })
      if (pdgUser) {
        await prisma.notification.create({
          data: {
            userId: pdgUser.id,
            title: "Nouvelle commande invité",
            message: `Une nouvelle commande (${newOrder.id.slice(0, 8).toUpperCase()}) a été passée par un invité: ${deliveryInfo.fullName}.`,
            type: "ORDER_UPDATE",
            data: JSON.stringify({
              orderId: newOrder.id,
              guestName: deliveryInfo.fullName,
              guestEmail: deliveryInfo.email,
              guestPhone: deliveryInfo.phone,
              total: total
            })
          }
        })
      }
    } catch (notificationError) {
      logger.warn("⚠️ Failed to create notification for PDG:", notificationError)
    }

    return NextResponse.json({
      order: {
        id: newOrder.id,
        status: newOrder.status,
        total: newOrder.total,
        itemCount: newOrder.items.length,
        createdAt: newOrder.createdAt,
        deliveryInfo: deliveryInfo
      }
    }, { status: 201 })

  } catch (error: any) {
    logger.error("❌ Error creating guest order:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la commande: " + error.message },
      { status: 500 }
    )
  }
}

