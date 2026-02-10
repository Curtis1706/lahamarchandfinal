import { monerooClient, isMonerooConfigured } from './client';
import { prisma } from '@/lib/prisma';

export class PaymentService {
    /**
     * Initialise un paiement pour une commande
     */
    static async initializePayment(orderId: string) {
        if (!isMonerooConfigured()) {
            throw new Error("Moneroo n'est pas configuré");
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: true,
                items: {
                    include: { work: true } // Pour avoir le titre des oeuvres
                }
            }
        });

        if (!order) {
            throw new Error("Commande introuvable");
        }

        // NOUVEAU: Bloquer si la commande n'est pas VALIDATED
        if (order.status === 'PENDING') {
            throw new Error("La commande doit être validée par un administrateur avant le paiement.");
        }

        if (order.paymentStatus === 'PAID') {
            throw new Error("Commande déjà payée");
        }

        // Préparation des données pour Moneroo
        const payload = {
            amount: order.total,
            currency: 'XOF', // Ou XAF selon la config
            customer: {
                email: order.user.email,
                first_name: order.user.name?.split(' ')[0] || 'Client',
                last_name: order.user.name?.split(' ').slice(1).join(' ') || 'Laha',
                phone: order.user.phone || undefined,
            },
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/success`, // Page de succès
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/cancel`,   // Page d'annulation
            reference: order.id, // On utilise l'ID de commande comme référence
            description: `Paiement commande #${order.id.slice(-8)}`,
            metadata: {
                orderId: order.id,
                userId: order.userId
            }
        };

        try {
            const payment = await monerooClient.payments.initialize(payload);

            // Sauvegarder l'ID de paiement Moneroo dans la commande
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    monerooPaymentId: payment.id,
                    monerooStatus: payment.status,
                    paymentMethod: 'Moneroo' // On note que la tentative est via Moneroo
                }
            });

            return payment;
        } catch (error) {
            console.error("Erreur initialisation paiement Moneroo:", error);
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
