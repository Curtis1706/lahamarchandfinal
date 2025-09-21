import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, OrderStatus, WorkStatus, ProjectStatus } from "@prisma/client"

// GET - Récupérer les statistiques du dashboard PDG
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    console.log("👑 Fetching PDG dashboard stats:", user.name)

    // Statistiques générales
    const [
      totalUsers,
      totalWorks,
      totalOrders,
      totalProjects,
      pendingConcepteurs,
      pendingProjects,
      lowStockWorks,
      totalRevenue
    ] = await Promise.all([
      // Total utilisateurs
      prisma.user.count(),
      
      // Total œuvres publiées
      prisma.work.count({
        where: { status: WorkStatus.PUBLISHED }
      }),
      
      // Total commandes
      prisma.order.count(),
      
      // Total projets
      prisma.project.count(),
      
      // Concepteurs en attente de validation
      prisma.user.count({
        where: {
          role: "CONCEPTEUR",
          emailVerified: null
        }
      }),
      
      // Projets en attente de validation
      prisma.project.count({
        where: {
          status: {
            in: [ProjectStatus.SUBMITTED, ProjectStatus.UNDER_REVIEW]
          }
        }
      }),
      
      // Œuvres avec stock faible
      prisma.work.count({
        where: {
          status: WorkStatus.PUBLISHED,
          stock: { lt: 10 }
        }
      }),
      
      // Chiffre d'affaires total
      prisma.order.aggregate({
        where: {
          status: { not: OrderStatus.CANCELLED }
        },
        _sum: { total: true }
      })
    ])

    // Commandes récentes
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            work: {
              select: { id: true, title: true }
            }
          }
        }
      }
    })

    // Projets récents
    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: { submittedAt: "desc" },
      include: {
        concepteur: {
          select: { id: true, name: true, email: true }
        },
        discipline: {
          select: { id: true, name: true }
        },
        work: {
          select: { id: true, title: true }
        }
      }
    })

    // Utilisateurs récents
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    })

    // Statistiques par rôle
    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true }
    })

    // Statistiques des commandes par statut
    const ordersByStatus = await prisma.order.groupBy({
      by: ["status"],
      _count: { status: true }
    })

    const stats = {
      overview: {
        totalUsers,
        totalWorks,
        totalOrders,
        totalProjects,
        totalRevenue: totalRevenue._sum.total || 0
      },
      alerts: {
        pendingConcepteurs,
        pendingProjects,
        lowStockWorks
      },
      recent: {
        orders: recentOrders,
        projects: recentProjects,
        users: recentUsers
      },
      breakdown: {
        usersByRole,
        ordersByStatus
      }
    }

    console.log(`👑 PDG dashboard stats loaded: ${totalUsers} users, ${totalWorks} works, ${totalOrders} orders`)

    return NextResponse.json({
      stats,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("❌ Error fetching PDG dashboard stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
