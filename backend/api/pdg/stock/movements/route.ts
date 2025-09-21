import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Getting current user...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un PDG
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "PDG") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Construire les filtres
    const where: any = {}
    if (workId) where.workId = workId
    if (type) where.type = type

    // Récupérer les mouvements de stock
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        work: {
          include: {
            discipline: true,
            author: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    })

    // Statistiques des mouvements
    const stats = await prisma.stockMovement.groupBy({
      by: ['type'],
      _count: { id: true },
      _sum: { quantity: true }
    })

    const response = {
      movements: movements.map(movement => ({
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        reference: movement.reference,
        performedBy: movement.performedBy,
        createdAt: movement.createdAt,
        work: {
          id: movement.work.id,
          title: movement.work.title,
          isbn: movement.work.isbn,
          discipline: movement.work.discipline.name,
          author: movement.work.author?.name || "Auteur inconnu"
        }
      })),
      stats: stats.map(stat => ({
        type: stat.type,
        count: stat._count.id,
        totalQuantity: stat._sum.quantity || 0
      }))
    }

    console.log("✅ Stock movements prepared:", {
      movementsCount: movements.length,
      statsCount: stats.length
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error fetching stock movements:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des mouvements de stock" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Creating stock movement...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un PDG
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "PDG") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { workId, type, quantity, reason, reference } = body

    if (!workId || !type || !quantity) {
      return NextResponse.json({ error: "workId, type et quantity requis" }, { status: 400 })
    }

    // Vérifier que l'œuvre existe
    const work = await prisma.work.findUnique({
      where: { id: workId }
    })

    if (!work) {
      return NextResponse.json({ error: "Œuvre introuvable" }, { status: 404 })
    }

    // Calculer le nouveau stock
    const newStock = work.stock + quantity

    // Vérifier que le stock ne devient pas négatif
    if (newStock < 0) {
      return NextResponse.json({ 
        error: `Stock insuffisant. Stock actuel: ${work.stock}, Tentative de retrait: ${Math.abs(quantity)}` 
      }, { status: 400 })
    }

    // Créer le mouvement de stock
    const movement = await prisma.stockMovement.create({
      data: {
        workId,
        type,
        quantity,
        reason: reason || null,
        reference: reference || null,
        performedBy: user.id
      }
    })

    // Mettre à jour le stock de l'œuvre
    await prisma.work.update({
      where: { id: workId },
      data: { 
        stock: newStock,
        updatedAt: new Date()
      }
    })

    // Récupérer l'œuvre mise à jour avec ses détails
    const updatedWork = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        discipline: true,
        author: true,
        concepteur: true
      }
    })

    const response = {
      movement: {
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        reference: movement.reference,
        createdAt: movement.createdAt
      },
      work: {
        id: updatedWork!.id,
        title: updatedWork!.title,
        isbn: updatedWork!.isbn,
        stock: updatedWork!.stock,
        minStock: updatedWork!.minStock,
        maxStock: updatedWork!.maxStock,
        price: updatedWork!.price,
        discipline: updatedWork!.discipline.name,
        author: updatedWork!.author?.name || "Auteur inconnu",
        stockStatus: updatedWork!.stock === 0 ? "out" : updatedWork!.stock <= updatedWork!.minStock ? "low" : "available"
      }
    }

    console.log("✅ Stock movement created:", movement.id)

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error("❌ Error creating stock movement:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du mouvement de stock" },
      { status: 500 }
    )
  }
}
