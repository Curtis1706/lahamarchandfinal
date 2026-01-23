import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/works/versions - Récupérer les versions d'une œuvre
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workId = searchParams.get('workId')
    const includeArchived = searchParams.get('includeArchived') === 'true'

    if (!workId) {
      return NextResponse.json({ error: "ID de l'œuvre requis" }, { status: 400 })
    }

    // Vérifier que l'œuvre existe
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { id: true, title: true }
    })

    if (!work) {
      return NextResponse.json({ error: "Œuvre non trouvée" }, { status: 404 })
    }

    // Récupérer les versions
    const versions = await prisma.workVersion.findMany({
      where: {
        workId,
        ...(includeArchived ? {} : { isActive: true })
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      work,
      versions
    })

  } catch (error) {
    logger.error("Erreur lors de la récupération des versions:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST /api/works/versions - Créer une nouvelle version
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut créer des versions
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { workId, version, title, description, publishedAt } = body

    if (!workId || !version || !title) {
      return NextResponse.json(
        { error: "workId, version et title sont requis" },
        { status: 400 }
      )
    }

    // Vérifier que l'œuvre existe
    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { id: true, title: true }
    })

    if (!work) {
      return NextResponse.json({ error: "Œuvre non trouvée" }, { status: 404 })
    }

    // Vérifier que la version n'existe pas déjà
    const existingVersion = await prisma.workVersion.findFirst({
      where: {
        workId,
        version
      }
    })

    if (existingVersion) {
      return NextResponse.json(
        { error: "Cette version existe déjà" },
        { status: 409 }
      )
    }

    // Créer la nouvelle version
    const newVersion = await prisma.workVersion.create({
      data: {
        workId,
        version,
        title,
        description,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
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

    // Mettre à jour la version de l'œuvre principale
    await prisma.work.update({
      where: { id: workId },
      data: {
        version,
        publicationDate: publishedAt ? new Date(publishedAt) : null
      }
    })

    return NextResponse.json(newVersion, { status: 201 })

  } catch (error) {
    logger.error("Erreur lors de la création de la version:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT /api/works/versions - Archiver une version
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut archiver des versions
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { versionId, isActive } = body

    if (!versionId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: "versionId et isActive sont requis" },
        { status: 400 }
      )
    }

    // Vérifier que la version existe
    const version = await prisma.workVersion.findUnique({
      where: { id: versionId },
      select: { id: true, workId: true, version: true }
    })

    if (!version) {
      return NextResponse.json({ error: "Version non trouvée" }, { status: 404 })
    }

    // Archiver ou réactiver la version
    const updatedVersion = await prisma.workVersion.update({
      where: { id: versionId },
      data: {
        isActive,
        archivedAt: isActive ? null : new Date()
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

    return NextResponse.json(updatedVersion)

  } catch (error) {
    logger.error("Erreur lors de la mise à jour de la version:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
