import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { logger } from "@/lib/logger"

export const dynamic = 'force-dynamic'

// POST /api/users/change-password - Changer le mot de passe
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
        }

        const body = await request.json()
        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères" }, { status: 400 })
        }

        // Récupérer l'utilisateur avec son mot de passe
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, password: true }
        })

        if (!user) {
            return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
        }

        // Vérifier le mot de passe actuel
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 })
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Mettre à jour le mot de passe
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        })

        logger.info(`Password changed for user ${user.id}`)

        return NextResponse.json({
            success: true,
            message: "Mot de passe changé avec succès"
        }, { status: 200 })

    } catch (error: any) {
        logger.error("Error changing password:", error)
        return NextResponse.json({
            error: error.message || "Erreur lors du changement de mot de passe"
        }, { status: 500 })
    }
}
