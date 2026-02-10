import { monerooClient, isMonerooConfigured } from './client';
import { prisma } from '@/lib/prisma';

export class PayoutService {
    /**
     * Récupère le solde disponible pour un auteur
     */
    static async getAvailableBalance(userId: string) {
        // 1. Total des royalties générées
        const royalties = await prisma.royalty.findMany({
            where: { userId: userId }
        });
        const totalGenerated = royalties.reduce((sum, r) => sum + r.amount, 0);

        // 2. Total des retraits (incluant l'ancien modèle et le nouveau)
        const withdrawalRequests = await prisma.withdrawalRequest.findMany({
            where: {
                userId: userId,
                status: { in: ['pending', 'processing', 'completed'] }
            }
        });

        const withdrawals = await prisma.withdrawal.findMany({
            where: {
                userId: userId,
                status: { in: ['PENDING', 'APPROVED', 'PAID'] }
            }
        });

        const totalWithdrawn = [
            ...withdrawalRequests.map(w => w.amount),
            ...withdrawals.map(w => w.amount)
        ].reduce((sum, amount) => sum + amount, 0);

        return Math.max(0, totalGenerated - totalWithdrawn);
    }

    /**
     * Crée une demande de retrait (Modèle legacy WithdrawalRequest)
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
            throw new Error(`Solde insuffisant. Disponible: ${balance} XOF`);
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
                status: 'processing'
            }
        });

        // 2. Initier le virement via Moneroo (si Mobile Money)
        if (data.method === 'mobile_money' && data.phoneNumber && data.provider) {
            try {
                const payoutPayload = {
                    amount: data.amount,
                    currency: "XOF",
                    method: "mobile_money",
                    provider: data.provider,
                    phone_number: data.phoneNumber,
                    description: `Retrait royalties Laha Marchand (Ref: ${withdrawalRequest.id})`,
                    external_reference: withdrawalRequest.id // Pas de préfixe ici car c'est WithdrawalRequest
                };

                const payout = await monerooClient.payouts.create(payoutPayload);

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

        return { success: true, request: withdrawalRequest, message: "Demande enregistrée pour traitement manuel" };
    }

    /**
     * Marquer les royalties correspondantes comme payées (pour stats)
     */
    static async markRoyaltiesAsPaid(userId: string, amountPaid: number) {
        const royalties = await prisma.royalty.findMany({
            where: { userId, paid: false },
            orderBy: { createdAt: 'asc' }
        });

        let remainingToCover = amountPaid;
        const royaltiesToUpdate = [];

        for (const royalty of royalties) {
            if (remainingToCover <= 0) break;
            // On ne marque que si la royalty entière est couverte (simplification)
            if (royalty.amount <= remainingToCover) {
                royaltiesToUpdate.push(royalty.id);
                remainingToCover -= royalty.amount;
            }
        }

        if (royaltiesToUpdate.length > 0) {
            await prisma.royalty.updateMany({
                where: { id: { in: royaltiesToUpdate } },
                data: { paid: true, paidAt: new Date() }
            });
        }
    }
}
