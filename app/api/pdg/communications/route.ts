import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/communications - Récupérer les communications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const communications = await prisma.communication.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Formater targetAudience (JSON string to array)
    const formattedComms = communications.map(comm => ({
      id: comm.id,
      title: comm.title,
      message: comm.message,
      type: comm.type.toLowerCase(),
      targetAudience: JSON.parse(comm.targetAudience),
      status: comm.status.toLowerCase(),
      createdAt: comm.createdAt.toISOString(),
      scheduledFor: comm.scheduledFor?.toISOString(),
      sentAt: comm.sentAt?.toISOString(),
      recipients: comm.recipients,
      readCount: comm.readCount
    }))

    return NextResponse.json(formattedComms)

  } catch (error) {
    logger.error("Error fetching communications:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/communications - Créer une communication
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const body = await request.json()
    const { title, message, type, targetAudience, scheduledFor } = body

    if (!title || !message || !type || !targetAudience) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const newComm = await prisma.communication.create({
      data: {
        title,
        message,
        type: type.toUpperCase(),
        targetAudience: JSON.stringify(targetAudience),
        status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        createdBy: session.user.id
      }
    })

    return NextResponse.json({
      id: newComm.id,
      title: newComm.title,
      message: newComm.message,
      type: newComm.type.toLowerCase(),
      targetAudience: JSON.parse(newComm.targetAudience),
      status: newComm.status.toLowerCase(),
      createdAt: newComm.createdAt.toISOString(),
      scheduledFor: newComm.scheduledFor?.toISOString(),
      recipients: 0,
      readCount: 0
    }, { status: 201 })

  } catch (error) {
    logger.error("Error creating communication:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
