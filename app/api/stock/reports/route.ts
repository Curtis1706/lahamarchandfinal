import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/stock/reports - Récupérer les rapports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut accéder aux rapports
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'reports', 'executions', 'generate'
    const reportId = searchParams.get('reportId')
    const reportType = searchParams.get('reportType')

    switch (type) {
      case 'reports':
        // Récupérer la liste des rapports
        const reports = await prisma.stockReport.findMany({
          include: {
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                executions: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        return NextResponse.json(reports)

      case 'executions':
        // Récupérer les exécutions d'un rapport
        if (!reportId) {
          return NextResponse.json(
            { error: "ID du rapport requis" },
            { status: 400 }
          )
        }

        const executions = await prisma.reportExecution.findMany({
          where: { reportId },
          orderBy: {
            startedAt: 'desc'
          },
          take: 20
        })

        return NextResponse.json(executions)

      case 'generate':
        // Générer un rapport à la demande
        if (!reportType) {
          return NextResponse.json(
            { error: "Type de rapport requis" },
            { status: 400 }
          )
        }

        const result = await generateReport(reportType, session.user.id)
        return NextResponse.json(result)

      default:
        return NextResponse.json({ error: "Type non valide" }, { status: 400 })
    }

  } catch (error) {
    console.error("Erreur lors de la récupération des rapports:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST /api/stock/reports - Créer un rapport
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut créer des rapports
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, parameters, schedule } = body

    if (!name || !type || !parameters) {
      return NextResponse.json(
        { error: "Nom, type et paramètres sont requis" },
        { status: 400 }
      )
    }

    // Calculer la prochaine exécution si un planning est fourni
    let nextRun = null
    if (schedule) {
      nextRun = calculateNextRun(schedule)
    }

    const newReport = await prisma.stockReport.create({
      data: {
        name,
        type,
        parameters: JSON.stringify(parameters),
        schedule,
        nextRun,
        createdBy: session.user.id
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(newReport, { status: 201 })

  } catch (error) {
    console.error("Erreur lors de la création du rapport:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT /api/stock/reports - Mettre à jour un rapport
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut modifier les rapports
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { reportId, name, type, parameters, schedule, isActive } = body

    if (!reportId) {
      return NextResponse.json(
        { error: "ID du rapport requis" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (parameters !== undefined) updateData.parameters = JSON.stringify(parameters)
    if (schedule !== undefined) {
      updateData.schedule = schedule
      updateData.nextRun = schedule ? calculateNextRun(schedule) : null
    }
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedReport = await prisma.stockReport.update({
      where: { id: reportId },
      data: updateData,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedReport)

  } catch (error) {
    console.error("Erreur lors de la mise à jour du rapport:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE /api/stock/reports - Supprimer un rapport
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut supprimer les rapports
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json(
        { error: "ID du rapport requis" },
        { status: 400 }
      )
    }

    // Vérifier que le rapport existe
    const report = await prisma.stockReport.findUnique({
      where: { id: reportId }
    })

    if (!report) {
      return NextResponse.json({ error: "Rapport non trouvé" }, { status: 404 })
    }

    // Supprimer le rapport et ses exécutions
    await prisma.stockReport.delete({
      where: { id: reportId }
    })

    return NextResponse.json({ message: "Rapport supprimé avec succès" })

  } catch (error) {
    console.error("Erreur lors de la suppression du rapport:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// Fonction pour générer un rapport
async function generateReport(reportType: string, userId: string) {
  const execution = await prisma.reportExecution.create({
    data: {
      reportId: 'temp', // ID temporaire pour les rapports à la demande
      status: 'RUNNING'
    }
  })

  try {
    let result: any = {}

    switch (reportType) {
      case 'INVENTORY_SUMMARY':
        result = await generateInventorySummary()
        break
      case 'SALES_ANALYSIS':
        result = await generateSalesAnalysis()
        break
      case 'STOCK_MOVEMENTS':
        result = await generateStockMovements()
        break
      case 'ALERTS_SUMMARY':
        result = await generateAlertsSummary()
        break
      default:
        throw new Error("Type de rapport non supporté")
    }

    // Mettre à jour l'exécution avec le résultat
    await prisma.reportExecution.update({
      where: { id: execution.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        result: JSON.stringify(result)
      }
    })

    return {
      executionId: execution.id,
      status: 'COMPLETED',
      result
    }

  } catch (error) {
    // Mettre à jour l'exécution avec l'erreur
    await prisma.reportExecution.update({
      where: { id: execution.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    })

    throw error
  }
}

// Fonctions de génération de rapports
async function generateInventorySummary() {
  const totalWorks = await prisma.work.count({
    where: { status: 'PUBLISHED' }
  })

  const lowStockWorks = await prisma.work.count({
    where: {
      status: 'PUBLISHED',
      stock: {
        lte: prisma.work.fields.minStock
      }
    }
  })

  const outOfStockWorks = await prisma.work.count({
    where: {
      status: 'PUBLISHED',
      stock: 0
    }
  })

  const totalValue = await prisma.work.aggregate({
    where: { status: 'PUBLISHED' },
    _sum: {
      stock: true
    }
  })

  return {
    totalWorks,
    lowStockWorks,
    outOfStockWorks,
    totalValue: totalValue._sum.stock || 0,
    generatedAt: new Date().toISOString()
  }
}

async function generateSalesAnalysis() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sales = await prisma.workSale.findMany({
    where: {
      saleDate: {
        gte: thirtyDaysAgo
      }
    },
    include: {
      work: {
        select: {
          title: true,
          discipline: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0)

  return {
    period: '30 derniers jours',
    totalSales,
    totalRevenue,
    salesCount: sales.length,
    generatedAt: new Date().toISOString()
  }
}

async function generateStockMovements() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const movements = await prisma.stockMovement.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      }
    },
    include: {
      work: {
        select: {
          title: true,
          isbn: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return {
    period: '30 derniers jours',
    movementsCount: movements.length,
    movements,
    generatedAt: new Date().toISOString()
  }
}

async function generateAlertsSummary() {
  const unreadAlerts = await prisma.stockAlert.count({
    where: {
      isRead: false,
      isResolved: false
    }
  })

  const criticalAlerts = await prisma.stockAlert.count({
    where: {
      severity: 'CRITICAL',
      isResolved: false
    }
  })

  const recentAlerts = await prisma.stockAlert.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
      }
    },
    include: {
      work: {
        select: {
          title: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  })

  return {
    unreadAlerts,
    criticalAlerts,
    recentAlerts,
    generatedAt: new Date().toISOString()
  }
}

// Fonction pour calculer la prochaine exécution
function calculateNextRun(schedule: string): Date {
  // Implémentation simple pour les expressions cron
  // Dans un vrai système, utiliser une librairie comme node-cron
  const now = new Date()
  
  if (schedule === 'daily') {
    const next = new Date(now)
    next.setDate(next.getDate() + 1)
    next.setHours(9, 0, 0, 0) // 9h00
    return next
  } else if (schedule === 'weekly') {
    const next = new Date(now)
    next.setDate(next.getDate() + 7)
    next.setHours(9, 0, 0, 0) // 9h00
    return next
  } else if (schedule === 'monthly') {
    const next = new Date(now)
    next.setMonth(next.getMonth() + 1)
    next.setDate(1)
    next.setHours(9, 0, 0, 0) // 9h00
    return next
  }
  
  return now
}
