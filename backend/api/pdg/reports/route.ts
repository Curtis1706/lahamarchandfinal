import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, OrderStatus, WorkStatus } from "@prisma/client"

// GET - Générer des rapports pour le PDG
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || "overview"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    console.log("👑 Generating report for PDG:", reportType)

    let reportData: any = {}

    switch (reportType) {
      case "overview":
        reportData = await generateOverviewReport()
        break
      case "sales":
        reportData = await generateSalesReport(startDate, endDate)
        break
      case "inventory":
        reportData = await generateInventoryReport()
        break
      case "users":
        reportData = await generateUsersReport()
        break
      case "royalties":
        reportData = await generateRoyaltiesReport(startDate, endDate)
        break
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    console.log(`✅ Generated ${reportType} report for PDG`)

    return NextResponse.json({
      reportType,
      data: reportData,
      generatedAt: new Date(),
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("❌ Error generating PDG report:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

async function generateOverviewReport() {
  // Statistiques générales
  const totalUsers = await prisma.user.count()
  const totalWorks = await prisma.work.count()
  const totalOrders = await prisma.order.count()
  const totalProjects = await prisma.project.count()

  // Utilisateurs par rôle
  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    _count: { role: true }
  })

  // Commandes par statut
  const ordersByStatus = await prisma.order.groupBy({
    by: ["status"],
    _count: { status: true }
  })

  // Œuvres par statut
  const worksByStatus = await prisma.work.groupBy({
    by: ["status"],
    _count: { status: true }
  })

  // Projets par statut
  const projectsByStatus = await prisma.project.groupBy({
    by: ["status"],
    _count: { status: true }
  })

  // Chiffre d'affaires total
  const totalRevenue = await prisma.order.aggregate({
    where: {
      status: { not: OrderStatus.CANCELLED }
    },
    _sum: {
      total: true
    }
  })

  return {
    summary: {
      totalUsers,
      totalWorks,
      totalOrders,
      totalProjects,
      totalRevenue: totalRevenue._sum.total || 0
    },
    usersByRole,
    ordersByStatus,
    worksByStatus,
    projectsByStatus
  }
}

async function generateSalesReport(startDate?: string, endDate?: string) {
  const whereClause: any = {
    status: { not: OrderStatus.CANCELLED }
  }

  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  // Commandes avec leurs items
  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true }
      },
      items: {
        include: {
          work: {
            select: { id: true, title: true, isbn: true, price: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // Calculer les statistiques de ventes
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalItemsSold = orders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  )

  // Ventes par discipline
  const salesByDiscipline = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const disciplineName = item.work.discipline?.name || "Non spécifié"
      if (!acc[disciplineName]) {
        acc[disciplineName] = { revenue: 0, quantity: 0 }
      }
      acc[disciplineName].revenue += item.price * item.quantity
      acc[disciplineName].quantity += item.quantity
    })
    return acc
  }, {} as Record<string, { revenue: number, quantity: number }>)

  // Top œuvres vendues
  const topWorks = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const workId = item.work.id
      if (!acc[workId]) {
        acc[workId] = {
          work: item.work,
          quantity: 0,
          revenue: 0
        }
      }
      acc[workId].quantity += item.quantity
      acc[workId].revenue += item.price * item.quantity
    })
    return acc
  }, {} as Record<string, any>)

  const topWorksArray = Object.values(topWorks)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10)

  return {
    period: { startDate, endDate },
    summary: {
      totalOrders: orders.length,
      totalRevenue,
      totalItemsSold
    },
    salesByDiscipline,
    topWorks: topWorksArray,
    orders
  }
}

async function generateInventoryReport() {
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
      }
    }
  })

  const totalStock = works.reduce((sum, work) => sum + (work.stock || 0), 0)
  const totalValue = works.reduce((sum, work) => sum + ((work.stock || 0) * work.price), 0)
  const lowStockWorks = works.filter(work => (work.stock || 0) < 10)
  const outOfStockWorks = works.filter(work => (work.stock || 0) === 0)

  return {
    summary: {
      totalWorks: works.length,
      totalStock,
      totalValue,
      lowStockCount: lowStockWorks.length,
      outOfStockCount: outOfStockWorks.length
    },
    lowStockWorks,
    outOfStockWorks,
    allWorks: works
  }
}

async function generateUsersReport() {
  const users = await prisma.user.findMany({
    include: {
      discipline: true,
      _count: {
        select: {
          conceivedProjects: true,
          conceivedWorks: true
        }
      }
    }
  })

  const usersByRole = users.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = []
    }
    acc[user.role].push(user)
    return acc
  }, {} as Record<string, any[]>)

  return {
    totalUsers: users.length,
    usersByRole,
    allUsers: users
  }
}

async function generateRoyaltiesReport(startDate?: string, endDate?: string) {
  // Cette fonction serait similaire à celle dans royalties/route.ts
  // mais avec des filtres de date et des calculs plus détaillés
  return {
    message: "Rapport de droits d'auteur en cours de développement"
  }
}
