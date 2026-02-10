import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/lib/moneroo/payment-service';

export async function POST(
    req: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🎯 [API /pay] NOUVELLE REQUÊTE DE PAIEMENT`);
        console.log(`${'='.repeat(80)}\n`);

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            console.error(`❌ [API /pay] Utilisateur NON authentifié`);
            return NextResponse.json({ error: "Veuillez vous connecter" }, { status: 401 });
        }

        console.log(`✅ [API /pay] Utilisateur authentifié: ${session.user.email} (ID: ${session.user.id})`);

        const { orderId } = params;
        console.log(`📦 [API /pay] Order ID: ${orderId}`);

        console.log(`🚀 [API /pay] Appel PaymentService.initializePayment()...`);
        const payment = await PaymentService.initializePayment(orderId);

        console.log(`✅ [API /pay] PaymentService.initializePayment() terminé avec succès`);
        console.log(`📥 [API /pay] Réponse Moneroo complète:`, JSON.stringify(payment, null, 2));

        // Adaptation à la réponse réelle de Moneroo : vérifier plusieurs champs possibles
        const paymentUrl = payment.data?.checkout_url || payment.data?.url || payment.checkout_url || payment.url || payment.payment_url || payment.link;

        console.log(`🔍 [API /pay] Extraction de l'URL de paiement...`);
        console.log(`🔍 [API /pay] payment.data?.checkout_url: ${payment.data?.checkout_url}`);
        console.log(`🔍 [API /pay] payment.checkout_url: ${payment.checkout_url}`);
        console.log(`🔍 [API /pay] payment.url: ${payment.url}`);
        console.log(`🔍 [API /pay] URL finale utilisée: ${paymentUrl}`);

        if (!paymentUrl) {
            console.error(`❌❌ [API /pay] AUCUNE URL de paiement trouvée dans la réponse !`);
            console.error(`❌ [API /pay] Réponse Moneroo:`, payment);
            return NextResponse.json({
                error: "Impossible de récupérer l'URL de paiement",
                details: payment
            }, { status: 502 });
        }

        console.log(`✅ [API /pay] URL de paiement trouvée: ${paymentUrl}`);
        console.log(`✅ [API /pay] Payment ID: ${payment.id}`);
        console.log(`\n${'='.repeat(80)}`);
        console.log(`✅ [API /pay] RÉPONSE ENVOYÉE AU CLIENT`);
        console.log(`${'='.repeat(80)}\n`);

        return NextResponse.json({
            success: true,
            paymentUrl: paymentUrl,
            paymentId: payment.id
        });

    } catch (error: any) {
        console.error(`\n${'='.repeat(80)}`);
        console.error(`❌❌❌ [API /pay] ERREUR CRITIQUE`);
        console.error(`${'='.repeat(80)}`);
        console.error(`❌ [API /pay] Error name: ${error.name}`);
        console.error(`❌ [API /pay] Error message: ${error.message}`);
        console.error(`❌ [API /pay] Error stack:`, error.stack);
        console.error(`${'='.repeat(80)}\n`);
        return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
    }
}
