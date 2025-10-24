import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/code-promo - Récupérer les codes promo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    // Récupérer les promotions depuis la base de données
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Formater les données pour l'interface
    const formattedPromotions = promotions.map(promo => ({
      id: promo.id,
      libelle: promo.libelle,
      code: promo.code,
      periode: promo.periode,
      livre: promo.livre,
      statut: promo.statut === 'ACTIF' ? 'Actif' : promo.statut === 'INACTIF' ? 'Inactif' : 'Expiré',
      taux: promo.taux,
      quantiteMinimale: promo.quantiteMinimale,
      creeLe: promo.createdAt.toLocaleString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: promo.createdBy
    }))

    return NextResponse.json(formattedPromotions)

  } catch (error) {
    console.error("Error fetching promotions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/code-promo - Créer un code promo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { libelle, code, periode, livre, statut, taux, quantiteMinimale } = await request.json()

    // Validation
    if (!libelle || !code || !taux) {
      return NextResponse.json({ 
        error: "Le libellé, le code et le taux sont obligatoires" 
      }, { status: 400 })
    }

    // Vérifier que le code n'existe pas déjà
    const existingPromo = await prisma.promotion.findUnique({
      where: { code }
    })

    if (existingPromo) {
      return NextResponse.json({ 
        error: "Ce code promo existe déjà" 
      }, { status: 400 })
    }

    // Créer la promotion en base de données
    const newPromotion = await prisma.promotion.create({
      data: {
        libelle,
        code: code.toUpperCase(), // Code en majuscules
        periode: periode || "Non spécifié",
        livre: livre || "Tous les livres",
        statut: statut === "Actif" ? 'ACTIF' : 'INACTIF',
        taux,
        quantiteMinimale: quantiteMinimale || 1,
        createdBy: session.user.name || session.user.email
      }
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PROMOTION_CREATED',
        performedBy: session.user.name || session.user.email,
        details: JSON.stringify({
          promotionId: newPromotion.id,
          code: newPromotion.code,
          libelle: newPromotion.libelle,
          taux: newPromotion.taux,
          description: `Code promo "${code}" créé`
        })
      }
    })

    // Formater pour la réponse
    const formattedPromotion = {
      id: newPromotion.id,
      libelle: newPromotion.libelle,
      code: newPromotion.code,
      periode: newPromotion.periode,
      livre: newPromotion.livre,
      statut: newPromotion.statut === 'ACTIF' ? 'Actif' : 'Inactif',
      taux: newPromotion.taux,
      quantiteMinimale: newPromotion.quantiteMinimale,
      creeLe: newPromotion.createdAt.toLocaleString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: newPromotion.createdBy
    }

    return NextResponse.json(formattedPromotion, { status: 201 })

  } catch (error: any) {
    console.error("Error creating promotion:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la création: " + error.message 
    }, { status: 500 })
  }
}

// PUT /api/pdg/code-promo - Modifier un code promo
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { id, libelle, periode, livre, statut, taux, quantiteMinimale } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Mettre à jour la promotion
    const updatedPromotion = await prisma.promotion.update({
      where: { id },
      data: {
        libelle,
        periode,
        livre,
        statut: statut === "Actif" ? 'ACTIF' : 'INACTIF',
        taux,
        quantiteMinimale
      }
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PROMOTION_UPDATED',
        performedBy: session.user.name || session.user.email,
        details: JSON.stringify({ 
          promotionId: id,
          description: `Code promo "${updatedPromotion.code}" modifié`
        })
      }
    })

    return NextResponse.json({ success: true, promotion: updatedPromotion })

  } catch (error: any) {
    console.error("Error updating promotion:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la mise à jour: " + error.message 
    }, { status: 500 })
  }
}

// DELETE /api/pdg/code-promo - Supprimer un code promo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    // Récupérer avant de supprimer pour le log
    const promotion = await prisma.promotion.findUnique({
      where: { id }
    })

    if (!promotion) {
      return NextResponse.json({ error: "Promotion non trouvée" }, { status: 404 })
    }

    // Supprimer la promotion
    await prisma.promotion.delete({
      where: { id }
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PROMOTION_DELETED',
        performedBy: session.user.name || session.user.email,
        details: JSON.stringify({
          promotionId: id,
          code: promotion.code,
          description: `Code promo "${promotion.code}" supprimé`
        })
      }
    })

    return NextResponse.json({ success: true, message: "Promotion supprimée" })

  } catch (error: any) {
    console.error("Error deleting promotion:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la suppression: " + error.message 
    }, { status: 500 })
  }
}
