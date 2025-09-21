import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, WorkStatus } from "@prisma/client"

// GET - Récupérer l'inventaire complet (PDG uniquement)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    console.log("👑 Fetching inventory for PDG:", user.name)

    // Récupérer toutes les œuvres avec leurs relations
    const works = await prisma.work.findMany({
      where: {
        status: WorkStatus.PUBLISHED
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        discipline: {
          select: { id: true, name: true }
        },
        orders: {
          select: { id: true, status: true, createdAt: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    console.log("👑 Found published works:", works.length)

    // Calculer les statistiques d'inventaire
    const stats = {
      totalWorks: works.length,
      totalStock: works.reduce((total, work) => total + (work.stock || 0), 0),
      lowStock: works.filter(work => (work.stock || 0) < 10).length,
      outOfStock: works.filter(work => (work.stock || 0) === 0).length,
      totalValue: works.reduce((total, work) => total + ((work.stock || 0) * work.price), 0)
    }

    // Grouper par discipline
    const byDiscipline = works.reduce((acc, work) => {
      const disciplineName = work.discipline.name
      if (!acc[disciplineName]) {
        acc[disciplineName] = {
          discipline: work.discipline,
          works: [],
          totalStock: 0,
          totalValue: 0
        }
      }
      acc[disciplineName].works.push(work)
      acc[disciplineName].totalStock += work.stock || 0
      acc[disciplineName].totalValue += (work.stock || 0) * work.price
      return acc
    }, {} as Record<string, any>)

    // Top œuvres par ventes
    const topSelling = works
      .map(work => ({
        ...work,
        salesCount: work.orders.filter(order => order.status === "DELIVERED").length
      }))
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 10)

    console.log(`👑 PDG inventory data: ${stats.totalWorks} works, ${stats.totalStock} total stock`)

    return NextResponse.json({
      works,
      stats,
      byDiscipline,
      topSelling,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("❌ Error fetching PDG inventory:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST - Mettre à jour le stock d'une œuvre (PDG uniquement)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const body = await request.json()
    const { workId, stock, action, notes } = body

    if (!workId || stock === undefined) {
      return NextResponse.json({ 
        error: "Missing required fields: workId, stock" 
      }, { status: 400 })
    }

    console.log(`👑 PDG updating stock for work ${workId}:`, stock)

    // Vérifier que l'œuvre existe
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: { author: true }
    })

    if (!work) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 })
    }

    // Mettre à jour le stock
    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: { 
        stock: Math.max(0, stock), // S'assurer que le stock n'est pas négatif
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        discipline: {
          select: { id: true, name: true }
        }
      }
    })

    // Créer une notification pour l'auteur (si l'auteur existe)
    if (work.authorId) {
      try {
        await prisma.notification.create({
          data: {
            userId: work.authorId,
            title: "Stock mis à jour",
            message: `Le stock de votre œuvre "${work.title}" a été mis à jour: ${stock} exemplaires`,
            type: "STOCK_UPDATE",
            data: JSON.stringify({ workId, stock, action })
          }
        })
      } catch (notificationError) {
        console.warn("⚠️ Could not create notification:", notificationError)
        // Continue without failing the main operation
      }
    }

    console.log(`✅ Work ${workId} stock updated to ${stock}`)

    return NextResponse.json({
      success: true,
      work: updatedWork,
      message: `Stock mis à jour avec succès`
    })

  } catch (error) {
    console.error("❌ Error updating PDG inventory:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
