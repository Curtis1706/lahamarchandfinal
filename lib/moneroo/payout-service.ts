import { monerooClient, isMonerooConfigured } from './client';
import { prisma } from '@/lib/prisma';

export class PayoutService {
    /**
     * Récupère le solde disponible pour un auteur
     */
    static async getAvailableBalance(userId: string) {
        const royalties = await prisma.royalty.findMany({
            where: {
                userId: userId,
                approved: true,
                paid: false
            }
        });

        const balance = royalties.reduce((sum, royalty) => sum + royalty.amount, 0);
        return balance;
    }

    /**
     * Crée une demande de retrait
     */
    static async requestPayout(userId: string, data: {
        amount: number;
        method: string; // 'mobile_money', 'bank_transfer'
        phoneNumber?: string;
        provider?: string;
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
    }) {
        if (!isMonerooConfigured()) {
            throw new Error("Moneroo n'est pas configuré");
        }

        const balance = await this.getAvailableBalance(userId);

        if (data.amount > balance) {
            throw new Error("Solde insuffisant");
        }

        // 1. Créer la demande en base de données (pending)
        const withdrawalRequest = await prisma.withdrawalRequest.create({
            data: {
                userId,
                amount: data.amount,
                method: data.method,
                phoneNumber: data.phoneNumber,
                provider: data.provider,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                accountName: data.accountName,
                status: 'processing' // On passe direct en processing car on appelle l'API tout de suite
            }
        });

        // 2. Initier le virement via Moneroo (si Mobile Money)
        if (data.method === 'mobile_money' && data.phoneNumber && data.provider) {
            try {
                const payoutPayload = {
                    amount: data.amount,
                    currency: "XOF",
                    method: "mobile_money",
                    provider: data.provider, // mtn, orange, etc.
                    phone_number: data.phoneNumber,
                    description: `Retrait royalties Laha Marchand (Ref: ${withdrawalRequest.id})`,
                    external_reference: withdrawalRequest.id
                };

                const payout = await monerooClient.payouts.create(payoutPayload);

                // Mise à jour avec l'ID Moneroo
                await prisma.withdrawalRequest.update({
                    where: { id: withdrawalRequest.id },
                    data: {
                        monerooPayoutId: payout.id,
                        status: payout.status === 'successful' ? 'completed' : 'processing'
                    }
                });

                return { success: true, request: withdrawalRequest, payout };

            } catch (error: any) {
                console.error("Erreur Payout Moneroo:", error);
                // On marque la demande comme échouée
                await prisma.withdrawalRequest.update({
                    where: { id: withdrawalRequest.id },
                    data: {
                        status: 'failed',
                        failureReason: error.message || "Erreur API Moneroo"
                    }
                });
                throw error;
            }
        }

        // Si autre méthode (Virement)
        return { success: true, request: withdrawalRequest, message: "Demande enregistrée pour traitement manuel (Virement)" };
    }

    /**
     * Marquer les royalties correspondantes comme payées une fois le retrait succès
     */
    static async markRoyaltiesAsPaid(userId: string, amountPaid: number) {
        const royalties = await prisma.royalty.findMany({
            where: { userId, approved: true, paid: false },
            orderBy: { createdAt: 'asc' }
        });

        let remainingToCover = amountPaid;
        const royaltiesToUpdate = [];

        for (const royalty of royalties) {
            if (remainingToCover <= 0) break;
            royaltiesToUpdate.push(royalty.id);
            remainingToCover -= royalty.amount;
        }

        if (royaltiesToUpdate.length > 0) {
            await prisma.royalty.updateMany({
                where: { id: { in: royaltiesToUpdate } },
                data: { paid: true, paidAt: new Date() }
            });
        }
    }
}
