import { monerooClient, isMonerooConfigured } from './client';
import { prisma } from '@/lib/prisma';

export class PaymentService {
    /**
     * Initialise un paiement pour une commande
     */
    static async initializePayment(orderId: string) {
        console.log(`🚀 [PaymentService] DÉBUT initializePayment pour commande: ${orderId}`);

        if (!isMonerooConfigured()) {
            console.error(`❌ [PaymentService] Moneroo NON configuré !`);
            throw new Error("Moneroo n'est pas configuré");
        }
        console.log(`✅ [PaymentService] Moneroo est configuré`);

        console.log(`📦 [PaymentService] Recherche de la commande ${orderId} dans la DB...`);
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: { work: true }
                }
            }
        });

        if (!order) {
            console.error(`❌ [PaymentService] Commande ${orderId} INTROUVABLE dans la DB !`);
            throw new Error("Commande introuvable");
        }
        console.log(`✅ [PaymentService] Commande trouvée: ${order.id}, Status: ${order.status}, PaymentStatus: ${order.paymentStatus}`);

        // NOUVEAU: Bloquer si la commande n'est pas VALIDATED
        if (order.status === 'PENDING') {
            console.warn(`⚠️ [PaymentService] Commande en statut PENDING - validation requise`);
            throw new Error("La commande doit être validée par un administrateur avant le paiement.");
        }

        if (order.paymentStatus === 'PAID') {
            console.warn(`⚠️ [PaymentService] Commande déjà payée !`);
            throw new Error("Commande déjà payée");
        }

        // Déterminer l'URL de base de l'application de manière robuste
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXTAUTH_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.lahagabon.com');

        console.log(`🌐 [PaymentService] Base URL utilisée: ${baseUrl}`);

        // Préparation des données pour Moneroo
        const payload = {
            amount: order.total,
            currency: 'XOF',
            customer: {
                email: order.user.email,
                first_name: order.user.name?.split(' ')[0] || 'Client',
                last_name: order.user.name?.split(' ').slice(1).join(' ') || 'Laha',
                phone: order.user.phone || undefined,
            },
            return_url: `${baseUrl}/orders/${order.id}/success?paymentStatus=success`,
            cancel_url: `${baseUrl}/orders/${order.id}/cancel`,
            reference: order.id,
            description: `Paiement commande #${order.id.slice(-8)}`,
            metadata: {
                orderId: order.id,
                userId: order.userId
            }
        };

        console.log(`📤 [PaymentService] Payload Moneroo préparé:`, JSON.stringify(payload, null, 2));

        try {
            console.log(`🔄 [PaymentService] Appel API Moneroo payments.initialize...`);
            const payment = await monerooClient.payments.initialize(payload);

            console.log(`✅ [PaymentService] Réponse Moneroo reçue:`, JSON.stringify(payment, null, 2));
            console.log(`💳 [PaymentService] Payment ID Moneroo: ${payment.id}`);
            console.log(`📊 [PaymentService] Payment Status: ${payment.status}`);

            // Sauvegarder l'ID de paiement Moneroo dans la commande
            console.log(`💾 [PaymentService] Mise à jour de la commande ${orderId} avec monerooPaymentId: ${payment.id}...`);

            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    monerooPaymentId: payment.id,
                    monerooStatus: payment.status,
                    paymentMethod: 'Moneroo'
                }
            });

            console.log(`✅ [PaymentService] Commande mise à jour avec succès !`);
            console.log(`✅ [PaymentService] monerooPaymentId sauvegardé: ${updatedOrder.monerooPaymentId}`);

            return payment;
        } catch (error: any) {
            console.error(`❌❌❌ [PaymentService] ERREUR lors de l'initialisation paiement Moneroo:`, error);
            console.error(`❌ [PaymentService] Error name: ${error.name}`);
            console.error(`❌ [PaymentService] Error message: ${error.message}`);
            console.error(`❌ [PaymentService] Error stack:`, error.stack);
            throw error;
        }
    }

    /**
     * Vérifie le statut d'un paiement via l'API
     */
    static async verifyPayment(paymentId: string) {
        try {
            const payment = await monerooClient.payments.get(paymentId);
            return payment;
        } catch (error) {
            console.error("Erreur vérification paiement:", error);
            throw error;
        }
    }
}
