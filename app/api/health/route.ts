import { logger } from '@/lib/logger'
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

/**
 * Healthcheck endpoint
 * GET /api/health
 * 
 * Vérifie que l'application et la base de données fonctionnent
 * Utilisé par les systèmes de monitoring (UptimeRobot, etc.)
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    // Vérifier la connexion à la base de données
    await prisma.$queryRaw`SELECT 1`
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      services: {
        database: 'up',
        api: 'up'
      },
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    logger.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      services: {
        database: 'down',
        api: 'up'
      },
      environment: process.env.NODE_ENV,
      error: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error')
        : 'Service unavailable'
    }, { status: 503 })
  }
}

