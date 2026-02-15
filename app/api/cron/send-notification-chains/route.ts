import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotificationChainSMS } from '@/lib/sms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/send-notification-chains
 * Tâche CRON qui envoie automatiquement les SMS des chaînes de notification
 * Exécutée toutes les 10 minutes via Vercel Cron
 */
export async function GET(request: NextRequest) {
    try {
        // Vérifier le token de sécurité Vercel
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error('❌ [CRON] Tentative d\'accès non autorisée');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        console.log(`🔄 [CRON] Démarrage de l'envoi des chaînes de notification - ${now.toISOString()}`);

        // Récupérer toutes les chaînes non envoyées dont la date est passée
        const chainsToSend = await prisma.notificationChain.findMany({
            where: {
                isSent: false,
                status: 'Actif',
                scheduledDate: {
                    lte: now
                },
                sendSMS: true
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                },
                order: {
                    select: {
                        id: true,
                        total: true,
                        paymentDueDate: true
                    }
                }
            }
        });

        console.log(`📊 [CRON] ${chainsToSend.length} chaîne(s) à envoyer`);

        let sent = 0;
        let failed = 0;
        const errors: Array<{ chainId: string; error: string }> = [];

        // Envoyer chaque SMS
        for (const chain of chainsToSend) {
            try {
                if (!chain.client?.phone) {
                    console.warn(`⚠️ [CRON] Chaîne ${chain.id} : Client sans numéro de téléphone`);
                    await prisma.notificationChain.update({
                        where: { id: chain.id },
                        data: {
                            failureReason: 'Client sans numéro de téléphone'
                        }
                    });
                    failed++;
                    continue;
                }

                // Envoyer le SMS
                const result = await sendNotificationChainSMS(
                    chain.client.phone,
                    chain.client.name,
                    chain.order?.total || 0,
                    chain.order?.id || chain.orderId || 'N/A',
                    chain.order?.paymentDueDate?.toISOString() || chain.scheduledDate.toISOString(),
                    chain.notificationType as 'CONFIRMATION' | 'REMINDER'
                );

                // Vérifier le succès
                const isSuccess = result.status === 'success' || result.status === true || result.code === 'SUBMITTED';

                if (isSuccess) {
                    // Marquer comme envoyé
                    await prisma.notificationChain.update({
                        where: { id: chain.id },
                        data: {
                            isSent: true,
                            sentAt: new Date()
                        }
                    });
                    sent++;
                    console.log(`✅ [CRON] Chaîne ${chain.id} envoyée avec succès`);
                } else {
                    // Logger l'erreur
                    const errorMsg = result.message || 'Erreur API SMS';
                    await prisma.notificationChain.update({
                        where: { id: chain.id },
                        data: {
                            failureReason: errorMsg
                        }
                    });
                    errors.push({ chainId: chain.id, error: errorMsg });
                    failed++;
                    console.error(`❌ [CRON] Chaîne ${chain.id} : ${errorMsg}`);
                }

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
                console.error(`❌ [CRON] Erreur envoi chaîne ${chain.id}:`, error);

                // Logger l'erreur dans la BDD
                await prisma.notificationChain.update({
                    where: { id: chain.id },
                    data: {
                        failureReason: errorMsg
                    }
                });

                errors.push({ chainId: chain.id, error: errorMsg });
                failed++;
            }
        }

        const summary = {
            success: true,
            timestamp: now.toISOString(),
            total: chainsToSend.length,
            sent,
            failed,
            errors: errors.length > 0 ? errors : undefined
        };

        console.log(`✅ [CRON] Terminé - ${sent} envoyé(s), ${failed} échec(s)`);

        return NextResponse.json(summary);

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
