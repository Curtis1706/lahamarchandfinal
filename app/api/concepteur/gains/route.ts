import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const concepteurId = session.user.id

    // Vérifier que l'utilisateur est un concepteur
    if (session.user.role !== "CONCEPTEUR") {
      return NextResponse.json({ error: "Forbidden - CONCEPTEUR role required" }, { status: 403 })
    }

    // Récupérer les royalties du concepteur (via les œuvres de ses projets)
    // Les royalties sont liées aux œuvres, et les œuvres sont liées aux projets via projectId
    const royalties = await prisma.royalty.findMany({
      where: {
        userId: concepteurId,
      },
      include: {
        work: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Grouper par projet
    const byProject = new Map<string, any>()

    for (const r of royalties) {
      const projectId = r.work?.project?.id || "NO_PROJECT"
      const projectTitle = r.work?.project?.title || "Hors projet"

      if (!byProject.has(projectId)) {
        byProject.set(projectId, {
          projectId: projectId === "NO_PROJECT" ? null : projectId,
          projectTitle,
          total: 0,
          available: 0, // approuvé mais pas encore payé
          paid: 0,
          lines: [],
        })
      }

      const bucket = byProject.get(projectId)!
      const amount = Number(r.amount || 0)
      bucket.total += amount

      if (r.paid) {
        bucket.paid += amount
      } else if (r.approved) {
        bucket.available += amount
      }

      bucket.lines.push({
        id: r.id,
        amount,
        approved: r.approved,
        paid: r.paid,
        approvedAt: r.approvedAt,
        paidAt: r.paidAt,
        createdAt: r.createdAt,
        workTitle: r.work?.title || null,
        workId: r.workId,
      })
    }

    const projects = Array.from(byProject.values())

    // Calculer les totaux
    const totals = projects.reduce(
      (acc, p) => {
        acc.total += p.total
        acc.available += p.available
        acc.paid += p.paid
        return acc
      },
      { total: 0, available: 0, paid: 0 }
    )

    return NextResponse.json({
      totals,
      projects,
    })
  } catch (error: any) {
    logger.error("❌ Error fetching concepteur gains:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    )
  }
}

