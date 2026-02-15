import { prisma } from '@/lib/prisma';

/**
 * Crée automatiquement 2 chaînes de notification pour une commande avec paiement en dépôt
 * - Chaîne 1 : Confirmation immédiate
 * - Chaîne 2 : Rappel à la date limite de paiement
 */
export async function createNotificationChainsForOrder(
    orderId: string,
    clientId: string,
    paymentDueDate: Date,
    createdById: string
) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                total: true,
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!order) {
            console.error(`❌ [Chaînes] Commande ${orderId} introuvable`);
            return;
        }

        const clientName = order.user?.name || 'Client';
        const amount = order.total.toLocaleString('fr-FR');
        const dueDate = paymentDueDate.toLocaleDateString('fr-FR');

        // Chaîne 1 : Confirmation immédiate
        const confirmationMessage = `Bonjour ${clientName}, Laha Edition vous confirme la validation de votre commande ${orderId} d'un montant de ${amount} F CFA. Échéance de paiement : ${dueDate}. Merci !`;

        await prisma.notificationChain.create({
            data: {
                title: `Confirmation commande ${orderId}`,
                clientId,
                scheduledDate: new Date(), // Immédiatement
                sendSMS: true,
                sendEmail: false,
                daysBefore: 0,
                status: 'Actif',
                message: confirmationMessage,
                orderId,
                // @ts-ignore - Le client Prisma local peut mettre du temps à se synchroniser
                notificationType: 'CONFIRMATION',
                createdById
            }
        });

        // Chaîne 2 : Rappel à la date limite
        const reminderMessage = `Bonjour ${clientName}, Laha Edition vous rappelle que l'échéance de paiement des ${amount} F CFA pour la commande ${orderId} arrive le ${dueDate}. Merci de bien vouloir régulariser dans les délais.`;

        await prisma.notificationChain.create({
            data: {
                title: `Rappel paiement ${orderId}`,
                clientId,
                scheduledDate: paymentDueDate,
                sendSMS: true,
                sendEmail: false,
                daysBefore: 0,
                status: 'Actif',
                message: reminderMessage,
                orderId,
                // @ts-ignore - Le client Prisma local peut mettre du temps à se synchroniser
                notificationType: 'REMINDER',
                createdById
            }
        });

        console.log(`✅ [Chaînes] 2 chaînes créées pour la commande ${orderId}`);
    } catch (error) {
        console.error(`❌ [Chaînes] Erreur création chaînes pour ${orderId}:`, error);
    }
}
