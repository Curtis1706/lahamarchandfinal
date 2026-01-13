import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateAvailableStock } from "@/lib/partner-stock"

export const dynamic = 'force-dynamic'

// POST /api/partenaire/returns - Créer une demande de retour
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { workId, quantity, reason, condition } = body

    if (!workId || !quantity || quantity <= 0 || !reason) {
      return NextResponse.json({ 
        error: 'ID de l\'œuvre, quantité et raison requises' 
      }, { status: 400 })
    }

    // Vérifier que le partenaire existe
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Vérifier que l'œuvre existe
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        discipline: { select: { name: true } },
        author: { select: { name: true } }
      }
    })

    if (!work) {
      return NextResponse.json({ error: 'Œuvre non trouvée' }, { status: 404 })
    }

    // Vérifier que le partenaire a du stock pour cette œuvre
    const partnerStock = await prisma.partnerStock.findFirst({
      where: {
        partnerId: partner.id,
        workId: workId
      }
    })

    if (!partnerStock) {
      return NextResponse.json({
        error: `Cette œuvre n'est pas allouée à votre stock`,
        available: 0
      }, { status: 400 })
    }

    // Calculer le stock disponible
    const available = calculateAvailableStock(
      partnerStock.allocatedQuantity,
      partnerStock.soldQuantity,
      partnerStock.returnedQuantity
    )

    if (available < quantity) {
      return NextResponse.json({
        error: `Stock insuffisant. Disponible: ${available}, Demandé: ${quantity}`,
        available: available
      }, { status: 400 })
    }

    // Vérifier les conditions de retour (délai, état, etc.)
    const MAX_RETURN_DAYS = 30
    const stockDate = partnerStock.updatedAt || partnerStock.createdAt
    const daysSinceAllocation = Math.floor((Date.now() - stockDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceAllocation > MAX_RETURN_DAYS) {
      return NextResponse.json({
        error: `Délai de retour dépassé (${MAX_RETURN_DAYS} jours maximum)`,
        daysSince: daysSinceAllocation
      }, { status: 400 })
    }

    // ⚠️ ATTENTION: Cette route remet le stock dans le stock central
    // Selon le cahier de charges, le partenaire ne devrait PAS toucher au stock central
    // Utiliser /api/partenaire/returns/register pour les retours qui ne touchent que le stock partenaire
    
    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le stock partenaire (incrémenter returnedQuantity uniquement)
      // availableQuantity est calculé, pas stocké
      await tx.partnerStock.update({
        where: { id: partnerStock.id },
        data: {
          returnedQuantity: {
            increment: quantity
          },
          updatedAt: new Date()
        }
      })

      // ⚠️ REMET LE STOCK DANS LE STOCK CENTRAL (logique métier à vérifier)
      // Selon le cahier de charges, le partenaire ne devrait pas toucher au stock central
      // Cette ligne est peut-être à retirer ou à modifier selon les besoins métier
      await tx.work.update({
        where: { id: workId },
        data: {
          stock: {
            increment: quantity
          }
        }
      })

      // Créer un mouvement de stock pour le retour
      await tx.stockMovement.create({
        data: {
          workId: workId,
          type: 'RETURN',
          quantity: quantity,
          reason: `Retour partenaire - ${reason}`,
          reference: `RETURN_${partner.id}_${Date.now()}`,
          performedBy: session.user.id,
          partnerId: partner.id
        }
      })

      // Créer une notification pour le PDG
      // Récupérer le PDG
      const pdg = await tx.user.findFirst({
        where: { role: 'PDG' }
      })

      if (pdg) {
        await tx.notification.create({
          data: {
            userId: pdg.id,
            title: 'Demande de retour',
            message: `Le partenaire ${partner.user.name} a retourné ${quantity} exemplaire(s) de "${work.title}". Raison: ${reason}`,
            type: 'RETURN_REQUEST',
            data: JSON.stringify({
              partnerId: partner.id,
              partnerName: partner.user.name,
              workId: workId,
              workTitle: work.title,
              quantity: quantity,
              reason: reason,
              condition: condition
            })
          }
        })
      }

      // Créer une notification pour le partenaire
      await tx.notification.create({
        data: {
          userId: partner.userId,
          title: 'Retour enregistré',
          message: `Votre retour de ${quantity} exemplaire(s) de "${work.title}" a été enregistré et sera traité par le PDG.`,
          type: 'RETURN_CONFIRMED',
          data: JSON.stringify({
            workId: workId,
            workTitle: work.title,
            quantity: quantity,
            reason: reason
          })
        }
      })

      // Créer un log d'audit
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'RETURN_CREATED',
          description: `Retour de ${quantity} exemplaires de "${work.title}" par ${partner.user.name}`,
          performedBy: partner.user.name || partner.user.email,
          details: JSON.stringify({
            partnerId: partner.id,
            workId: workId,
            quantity: quantity,
            reason: reason,
            condition: condition
          })
        }
      })

      return {
        partnerId: partner.id,
        workId: workId,
        quantity: quantity,
        reason: reason
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Retour enregistré avec succès',
      data: result
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Erreur lors de la création du retour:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la création du retour: ' + error.message 
    }, { status: 500 })
  }
}

// GET /api/partenaire/returns - Récupérer l'historique des retours
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PARTENAIRE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Vérifier que le partenaire existe
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id }
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 })
    }

    // Récupérer les mouvements de stock de type RETURN
    const returns = await prisma.stockMovement.findMany({
      where: {
        partnerId: partner.id,
        type: 'RETURN'
      },
      include: {
        work: {
          select: {
            id: true,
            title: true,
            isbn: true,
            price: true,
            discipline: { select: { name: true } },
            author: { select: { name: true } }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formattedReturns = returns.map(ret => ({
      id: ret.id,
      workId: ret.workId,
      workTitle: ret.work.title,
      workIsbn: ret.work.isbn,
      discipline: ret.work.discipline?.name || 'N/A',
      author: ret.work.author?.name || 'N/A',
      quantity: ret.quantity,
      reason: ret.reason,
      reference: ret.reference,
      createdAt: ret.createdAt.toISOString(),
      status: 'PROCESSED' // Par défaut, considéré comme traité
    }))

    return NextResponse.json(formattedReturns)

  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des retours:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des retours: ' + error.message 
    }, { status: 500 })
  }
}


