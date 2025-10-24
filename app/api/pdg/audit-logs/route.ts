import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/audit-logs - Récupérer les logs d'audit
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const level = searchParams.get('level')

    // Récupérer les logs d'audit
    const whereClause: any = {}
    if (category && category !== 'all') {
      whereClause.action = { contains: category }
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 100
    })

    const formattedLogs = auditLogs.map(log => {
      let parsedDetails: any = {}
      try {
        if (log.details) {
          parsedDetails = JSON.parse(log.details)
        }
      } catch (e) {
        console.error("Error parsing log details:", e)
      }

      // Déterminer la catégorie à partir de l'action
      let logCategory = 'system'
      if (log.action.includes('user') || log.action.includes('User')) {
        logCategory = 'user'
      } else if (log.action.includes('order') || log.action.includes('Order')) {
        logCategory = 'order'
      } else if (log.action.includes('work') || log.action.includes('Work')) {
        logCategory = 'work'
      } else if (log.action.includes('discipline') || log.action.includes('Discipline')) {
        logCategory = 'discipline'
      } else if (log.action.includes('payment') || log.action.includes('finance')) {
        logCategory = 'financial'
      }

      // Déterminer le niveau à partir de l'action
      let logLevel: 'info' | 'success' | 'warning' | 'error' = 'info'
      if (log.action.includes('created') || log.action.includes('validated')) {
        logLevel = 'success'
      } else if (log.action.includes('deleted') || log.action.includes('rejected')) {
        logLevel = 'warning'
      } else if (log.action.includes('error') || log.action.includes('failed')) {
        logLevel = 'error'
      }

      return {
        id: log.id,
        action: log.action,
        description: log.description || log.action,
        user: {
          id: log.userId || '',
          name: log.performedBy || 'Système',
          role: parsedDetails.performedByRole || 'PDG'
        },
        target: parsedDetails.target || undefined,
        timestamp: log.timestamp.toISOString(),
        level: logLevel,
        category: logCategory
      }
    })

    // Filtrer par level si spécifié
    let filteredLogs = formattedLogs
    if (level && level !== 'all') {
      filteredLogs = formattedLogs.filter(log => log.level === level)
    }

    return NextResponse.json(filteredLogs)

  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


