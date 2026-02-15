// @ts-nocheck
import { prisma } from './prisma';
import { sendNotificationChainSMS } from './sms';
import { sendEmail } from './native-email';

/**
 * Service centralisé pour traiter les envois de notifications
 */
export async function processNotificationChains() {
    const now = new Date();
    console.log(`🔄 [PROCESSOR] Démarrage du traitement - ${now.toISOString()}`);

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

    console.log(`📊 [PROCESSOR] ${chainsToSend.length} chaîne(s) à traiter`);

    let sent = 0;
    let failed = 0;
    const errors: Array<{ chainId: string; error: string }> = [];

    for (const chain of chainsToSend) {
        try {
            let smsSuccess = true;
            let emailSuccess = true;
            let errorMessages = [];

            // 1. SMS
            if (chain.sendSMS) {
                if (!chain.client?.phone) {
                    errorMessages.push('SMS: Client sans numéro');
                    smsSuccess = false;
                } else {
                    const result = await sendNotificationChainSMS(
                        chain.client.phone,
                        chain.client.name,
                        chain.order?.total || 0,
                        chain.order?.id || chain.orderId || 'N/A',
                        chain.order?.paymentDueDate?.toISOString() || chain.scheduledDate.toISOString(),
                        // @ts-ignore
                        chain.notificationType
                    );
                    smsSuccess = result.status === 'success' || result.status === true || result.code === 'SUBMITTED';
                    if (!smsSuccess) errorMessages.push(`SMS: ${result.message || 'Erreur API'}`);
                }
            }

            // 2. Email
            if (chain.sendEmail) {
                if (!chain.client?.email) {
                    errorMessages.push('Email: Client sans adresse email');
                    emailSuccess = false;
                } else {
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
            } else {
                const errorMsg = errorMessages.join(' | ') || 'Erreur inconnue';
                await prisma.notificationChain.update({
                    where: { id: chain.id },
                    data: { failureReason: errorMsg }
                });
                errors.push({ chainId: chain.id, error: errorMsg });
                failed++;
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
            await prisma.notificationChain.update({
                where: { id: chain.id },
                data: { failureReason: errorMsg }
            });
            errors.push({ chainId: chain.id, error: errorMsg });
            failed++;
        }
    }

    return { total: chainsToSend.length, sent, failed, errors };
}
