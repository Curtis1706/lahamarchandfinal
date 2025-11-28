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
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const formattedLogs = auditLogs.map(log => {
      let parsedDetails: any = {}
      let parsedMetadata: any = {}
      
      try {
        if (log.details) {
          parsedDetails = JSON.parse(log.details)
        }
      } catch (e) {
        console.error("Error parsing log details:", e)
      }

      try {
        if (log.metadata) {
          parsedMetadata = JSON.parse(log.metadata)
        }
      } catch (e) {
        console.error("Error parsing log metadata:", e)
      }

      // Déterminer la catégorie à partir de l'action
      let logCategory: 'user' | 'order' | 'work' | 'discipline' | 'system' | 'financial' = 'system'
      const actionLower = log.action.toLowerCase()
      if (actionLower.includes('user')) {
        logCategory = 'user'
      } else if (actionLower.includes('order')) {
        logCategory = 'order'
      } else if (actionLower.includes('work')) {
        logCategory = 'work'
      } else if (actionLower.includes('discipline')) {
        logCategory = 'discipline'
      } else if (actionLower.includes('payment') || actionLower.includes('finance')) {
        logCategory = 'financial'
      }

      // Déterminer le niveau à partir de l'action
      let logLevel: 'info' | 'success' | 'warning' | 'error' = 'info'
      if (actionLower.includes('created') || actionLower.includes('validated') || actionLower.includes('approved')) {
        logLevel = 'success'
      } else if (actionLower.includes('deleted') || actionLower.includes('rejected')) {
        logLevel = 'warning'
      } else if (actionLower.includes('error') || actionLower.includes('failed')) {
        logLevel = 'error'
      }

      return {
        id: log.id,
        action: log.action,
        description: parsedDetails.message || parsedDetails.description || log.action,
        user: {
          id: log.userId || '',
          name: log.performedBy || 'Système',
          role: parsedDetails.performedByRole || parsedMetadata.role || 'PDG'
        },
        target: parsedDetails.target || parsedMetadata.target || undefined,
        timestamp: log.createdAt.toISOString(),
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

  } catch (error: any) {
    console.error("Error fetching audit logs:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des logs d'audit",
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}


