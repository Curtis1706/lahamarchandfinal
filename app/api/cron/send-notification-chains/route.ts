import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { processNotificationChains } from '@/lib/notifications-sender';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/send-notification-chains
 * Tâche CRON qui envoie automatiquement les SMS et Emails des chaînes de notification
 */
export async function GET(request: NextRequest) {
    try {
        // Vérification hybride : Token Vercel OU Session PDG
        const authHeader = request.headers.get('authorization');
        const isCronSecretValid = authHeader === `Bearer ${process.env.CRON_SECRET}`;

        let isPdgSession = false;
        if (!isCronSecretValid) {
            const session = await getServerSession(authOptions);
            isPdgSession = session?.user?.role === 'PDG';
        }

        if (!isCronSecretValid && !isPdgSession) {
            console.error('❌ [CRON] Tentative d\'accès non autorisée');
            return NextResponse.json({ error: 'Accès non autorisé ', message: 'Session PDG ou Token requis' }, { status: 401 });
        }

        const now = new Date();
        const triggerMode = isCronSecretValid ? 'SYSTEM' : 'MANUAL';
        console.log(`🔄 [CRON][${triggerMode}] Démarrage de l'envoi - ${now.toISOString()}`);

        const result = await processNotificationChains();

        console.log(`\n🏁 [CRON] Fin du traitement : ${result.sent} réussi(s), ${result.failed} échec(s)`);

        return NextResponse.json({
            success: true,
            triggerMode,
            ...result
        });

    } catch (error) {
        console.error('❌ [CRON] Erreur critique:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erreur serveur',
                message: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
}
