import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/lib/moneroo/payment-service';

export async function POST(
    req: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Veuillez vous connecter" }, { status: 401 });
        }

        const { orderId } = params;

        const payment = await PaymentService.initializePayment(orderId);

        console.log("Moneroo Payment Response:", JSON.stringify(payment, null, 2));

        // Adaptation à la réponse réelle de Moneroo : vérifier plusieurs champs possibles
        // La réponse observée est { data: { checkout_url: "..." } }
        const paymentUrl = payment.data?.checkout_url || payment.data?.url || payment.checkout_url || payment.url || payment.payment_url || payment.link;

        if (!paymentUrl) {
            console.error("Aucune URL de paiement trouvée dans la réponse Moneroo:", payment);
            return NextResponse.json({
                error: "Impossible de récupérer l'URL de paiement",
                details: payment
            }, { status: 502 });
        }

        return NextResponse.json({
            success: true,
            paymentUrl: paymentUrl,
            paymentId: payment.id
        });

    } catch (error: any) {
        console.error("Erreur API paiement:", error);
        return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
    }
}
