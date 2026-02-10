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

        // Vérifier si monerooPaymentId existe
        if (!order.monerooPaymentId) {
            console.warn(`⚠️ Commande ${orderId} sans monerooPaymentId.`);
        }

        console.log(`🔍 Vérification commande ${orderId}. MonerooID: ${order.monerooPaymentId}`);

        let paymentInfo;
        try {
            if (order.monerooPaymentId) {
                paymentInfo = await PaymentService.verifyPayment(order.monerooPaymentId);
            } else {
                return NextResponse.json({
                    success: false,
                    message: "Aucun ID de paiement associé à cette commande."
                });
            }
        } catch (err: any) {
            console.error(`❌ Erreur appel Moneroo pour ${orderId}:`, err.message);
            return NextResponse.json({
                success: false,
                message: "Erreur lors de la vérification Moneroo: " + err.message
            });
        }

        console.log(`🔍 Réponse Moneroo brute pour ${orderId}:`, JSON.stringify(paymentInfo, null, 2));

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
