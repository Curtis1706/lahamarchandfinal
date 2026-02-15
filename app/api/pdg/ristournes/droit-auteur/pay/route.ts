import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/pdg/ristournes/droit-auteur/pay
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (session.user.role !== "PDG") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { authorId, workId } = body

        if (!authorId || !workId) {
            return NextResponse.json({ error: "Author ID and Work ID are required" }, { status: 400 })
        }

        // Mettre à jour les royalties
        const result = await prisma.royalty.updateMany({
            where: {
                userId: authorId,
                workId: workId,
                paid: false
            },
            data: {
                paid: true,
                paidAt: new Date()
            }
        })

        logger.info(`Paid ${result.count} royalties for author ${authorId} on work ${workId}`)

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `${result.count} droits d'auteur marqués comme payés`
        })

    } catch (error) {
        logger.error("Error paying royalties:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
