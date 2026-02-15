import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotificationChainSMS } from '@/lib/sms';
import { sendEmail } from '@/lib/native-email';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/send-notification-chains
 * Tâche CRON qui envoie automatiquement les SMS et Emails des chaînes de notification
 * Exécutée toutes les 10 minutes via Vercel Cron
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
            return NextResponse.json({ error: 'Accès non autorisé', message: 'Session PDG ou Token requis' }, { status: 401 });
        }

        const now = new Date();
        const triggerMode = isCronSecretValid ? 'SYSTEM' : 'MANUAL';
        console.log(`🔄 [CRON][${triggerMode}] Démarrage de l'envoi - ${now.toISOString()}`);

        // Récupérer toutes les chaînes non envoyées dont la date est passée
        const chainsToSend = await prisma.notificationChain.findMany({
            where: {
                isSent: false,
                status: 'Actif',
                scheduledDate: {
                    lte: now
                },
                OR: [
                    { sendSMS: true },
                    { sendEmail: true }
                ]
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true
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

        console.log(`📊 [CRON] ${chainsToSend.length} chaîne(s) à traiter à ${now.toISOString()}`);

        let sent = 0;
        let failed = 0;
        const errors: Array<{ chainId: string; error: string }> = [];

        // Traiter chaque chaîne
        for (const chain of chainsToSend) {
            const anonymizedPhone = chain.client?.phone ? chain.client.phone.replace(/(\d{3})\d+(\d{2})/, "$1****$2") : 'N/A';
            console.log(`\n🔍 [CRON][CHAINE:${chain.id}] Traitement pour ${chain.client?.name || 'Inconnu'}`);

            try {
                let smsSuccess = true;
                let emailSuccess = true;
                let errorMessages = [];

                // 1. Gérer l'envoi SMS
                if (chain.sendSMS) {
                    if (!chain.client?.phone) {
                        errorMessages.push('SMS: Client sans numéro');
                        smsSuccess = false;
                    } else {
                        console.log(`📡 [CRON][CHAINE:${chain.id}] Envoi SMS à ${anonymizedPhone}...`);
                        const result = await sendNotificationChainSMS(
                            chain.client.phone,
                            chain.client.name,
                            chain.order?.total || 0,
                            chain.order?.id || chain.orderId || 'N/A',
                            chain.order?.paymentDueDate?.toISOString() || chain.scheduledDate.toISOString(),
                            chain.notificationType as 'CONFIRMATION' | 'REMINDER'
                        );
                        smsSuccess = result.status === 'success' || result.status === true || result.code === 'SUBMITTED';
                        if (!smsSuccess) errorMessages.push(`SMS: ${result.message || 'Erreur API'}`);
                    }
                }

                // 2. Gérer l'envoi Email
                if (chain.sendEmail) {
                    if (!chain.client?.email) {
                        errorMessages.push('Email: Client sans adresse email');
                        emailSuccess = false;
                    } else {
                        console.log(`📧 [CRON][CHAINE:${chain.id}] Envoi Email à ${chain.client.email}...`);
                        const emailResult = await sendEmail({
                            to: chain.client.email,
                            subject: chain.title,
                            html: `<p>${chain.message.replace(/\n/g, '<br>')}</p>`,
                            text: chain.message
                        });
                        emailSuccess = emailResult.success;
                        if (!emailSuccess) errorMessages.push(`Email: ${emailResult.error || 'Erreur SMTP'}`);
                    }
                }

                // Vérifier si globalement c'est un succès (si au moins un canal demandé a réussi et l'autre n'était pas bloquant)
                const isGlobalSuccess = (chain.sendSMS ? smsSuccess : true) && (chain.sendEmail ? emailSuccess : true);

                if (isGlobalSuccess) {
                    await prisma.notificationChain.update({
                        where: { id: chain.id },
                        data: {
                            isSent: true,
                            sentAt: new Date(),
                            failureReason: errorMessages.length > 0 ? errorMessages.join(' | ') : null
                        }
                    });
                    sent++;
                    console.log(`✅ [CRON][CHAINE:${chain.id}] Traitement terminé avec succès`);
                } else {
                    const errorMsg = errorMessages.join(' | ') || 'Erreur inconnue';
                    await prisma.notificationChain.update({
                        where: { id: chain.id },
                        data: {
                            failureReason: errorMsg
                        }
                    });
                    errors.push({ chainId: chain.id, error: errorMsg });
                    failed++;
                    console.error(`❌ [CRON][CHAINE:${chain.id}] Échec partiel ou total : ${errorMsg}`);
                }

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
                console.error(`❌ [CRON][CHAINE:${chain.id}] Erreur critique :`, error);
                await prisma.notificationChain.update({
                    where: { id: chain.id },
                    data: { failureReason: errorMsg }
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

        console.log(`\n🏁 [CRON] Fin du traitement : ${sent} réussi(s), ${failed} échec(s)`);
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
