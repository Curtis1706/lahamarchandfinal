import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaymentService } from '@/lib/moneroo/payment-service';

export async function POST(
    req: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        // Authentification optionnelle mais recommandée pour éviter les abus
        // Pour la page de succès publique, on peut être plus souple ou vérifier un token
        // Ici on laisse ouvert car c'est appelé par le client après redirection

        const { orderId } = params;

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        }

        if (order.paymentStatus === 'PAID') {
            return NextResponse.json({
                success: true,
                status: 'PAID',
                message: "Commande déjà payée"
            });
        }

        if (!order.monerooPaymentId) {
            return NextResponse.json({
                success: false,
                status: order.paymentStatus,
                message: "Aucun paiement Moneroo initié"
            });
        }

        // Vérifier le statut auprès de Moneroo
        const paymentInfo = await PaymentService.verifyPayment(order.monerooPaymentId);

        console.log(`🔍 Vérification paiement commande ${orderId}:`, paymentInfo);

        const statusLower = paymentInfo.status?.toLowerCase();
        const successStatuses = ['successful', 'success', 'completed', 'paid'];

        if (successStatuses.includes(statusLower)) {
            // Mettre à jour la commande si payée
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'VALIDATED', // Ou garder le statut actuel si workflow différent
                    paymentStatus: 'PAID',
                    paidAt: new Date(),
                    monerooStatus: 'successful'
                }
            });

            return NextResponse.json({
                success: true,
                status: 'PAID',
                message: "Paiement validé avec succès"
            });
        }

        return NextResponse.json({
            success: false,
            status: order.paymentStatus,
            monerooStatus: paymentInfo.status,
            message: "Paiement non finalisé"
        });

    } catch (error: any) {
        console.error("Erreur vérification paiement:", error);
        return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
    }
}
