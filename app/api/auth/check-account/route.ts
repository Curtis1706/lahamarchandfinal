import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Vérifie le statut d'un compte avant la connexion
 * Permet d'afficher la modale de suspension avant l'authentification NextAuth
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json(
                { error: 'Email requis' },
                { status: 400 }
            )
        }

        // Rechercher l'utilisateur
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                status: true,
                name: true
            }
        })

        if (!user) {
            // Ne pas révéler si l'utilisateur existe ou non (sécurité)
            return NextResponse.json({
                status: 'UNKNOWN',
                canLogin: true
            })
        }

        // Vérifier le statut
        if (user.status === 'SUSPENDED') {
            logger.info('Account check: suspended account', { userId: user.id, email })
            return NextResponse.json({
                status: 'SUSPENDED',
                canLogin: false,
                message: 'Votre compte a été temporairement suspendu.'
            })
        }

        if (user.status === 'INACTIVE') {
            logger.info('Account check: inactive account', { userId: user.id, email })
            return NextResponse.json({
                status: 'INACTIVE',
                canLogin: false,
                message: 'Votre compte est désactivé.'
            })
        }

        // Compte actif ou en attente - autoriser la tentative de connexion
        return NextResponse.json({
            status: user.status,
            canLogin: true
        })

    } catch (error: any) {
        logger.error('Error checking account status:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la vérification du compte' },
            { status: 500 }
        )
    }
}
