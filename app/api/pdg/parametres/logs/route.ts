import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/pdg/parametres/logs - Récupérer les logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const logType = searchParams.get('logType') || 'all'
    const date = searchParams.get('date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit

    // Construire les conditions de filtre
    const where: any = {}

    if (date) {
      const dateObj = new Date(date)
      where.createdAt = {
        gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        lt: new Date(dateObj.setHours(23, 59, 59, 999))
      }
    }

    // Filtrer par type de log
    if (logType === 'Log connexion') {
      where.action = {
        contains: 'LOGIN',
        mode: 'insensitive'
      }
    } else if (logType === 'Log système') {
      where.action = {
        not: {
          contains: 'LOGIN',
          mode: 'insensitive'
        }
      }
    } else if (logType === 'Log erreurs') {
      where.action = {
        contains: 'ERROR',
        mode: 'insensitive'
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.auditLog.count({ where })
    ])

    // Formater les logs pour l'affichage
    const formattedLogs = logs.map(log => {
      const details = log.details ? JSON.parse(log.details) : {}
      return {
        id: log.id,
        timestamp: format(log.createdAt, 'yyyy-MM-dd HH:mm:ss', { locale: fr }),
        action: log.action,
        performedBy: log.performedBy,
        userId: log.userId,
        details: details,
        formattedLine: `[${format(log.createdAt, 'yyyy-MM-dd HH:mm:ss', { locale: fr })}] ${log.action} - ${log.performedBy}${log.userId ? ` (User: ${log.userId})` : ''}${log.details ? ` - ${JSON.stringify(details)}` : ''}`
      }
    })

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    logger.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des logs' },
      { status: 500 }
    )
  }
}

