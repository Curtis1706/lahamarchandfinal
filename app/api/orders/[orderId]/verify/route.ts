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
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🔍 [API /verify] VÉRIFICATION DE PAIEMENT DEMANDÉE`);
        console.log(`${'='.repeat(80)}\n`);

        const { orderId } = params;
        console.log(`📦 [API /verify] Order ID: ${orderId}`);

        console.log(`📊 [API /verify] Recherche de la commande dans la DB...`);
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            console.error(`❌ [API /verify] Commande ${orderId} NON TROUVÉE !`);
            return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        }

        console.log(`✅ [API /verify] Commande trouvée`);
        console.log(`📊 [API /verify] Status: ${order.status}`);
        console.log(`💳 [API /verify] PaymentStatus: ${order.paymentStatus}`);
        console.log(`🔢 [API /verify] monerooPaymentId: ${order.monerooPaymentId || 'NULL ❌'}`);
        console.log(`📝 [API /verify] monerooStatus: ${order.monerooStatus || 'NULL'}`);
        console.log(`💰 [API /verify] Total: ${order.total} XOF`);

        if (order.paymentStatus === 'PAID') {
            console.log(`✅ [API /verify] Commande DÉJÀ PAYÉE - Retour immédiat`);
            return NextResponse.json({
                success: true,
                status: 'PAID',
                message: "Commande déjà payée"
            });
        }

        // Vérifier si monerooPaymentId existe
        if (!order.monerooPaymentId) {
            console.error(`❌❌ [API /verify] PROBLÈME: Commande ${orderId} SANS monerooPaymentId !`);
            console.error(`❌ [API /verify] Impossible de vérifier le paiement sur Moneroo sans ID`);
            console.error(`💡 [API /verify] SUGGESTION: Le monerooPaymentId n'a pas été sauvegardé lors de l'initialisation`);
            return NextResponse.json({
                success: false,
                message: "Aucun ID de paiement associé à cette commande."
            });
        }

        console.log(`✅ [API /verify] monerooPaymentId présent: ${order.monerooPaymentId}`);
        console.log(`🔄 [API /verify] Appel API Moneroo pour vérifier le statut...`);

        let paymentInfo;
        try {
            paymentInfo = await PaymentService.verifyPayment(order.monerooPaymentId);
            console.log(`✅ [API /verify] Réponse Moneroo reçue avec succès`);
        } catch (err: any) {
            console.error(`❌❌ [API /verify] ERREUR lors de l'appel Moneroo pour ${orderId}:`, err.message);
            console.error(`❌ [API /verify] Error stack:`, err.stack);
            return NextResponse.json({
                success: false,
                message: "Erreur lors de la vérification Moneroo: " + err.message
            });
        }

        console.log(`📥 [API /verify] Réponse Moneroo complète:`, JSON.stringify(paymentInfo, null, 2));
        console.log(`📊 [API /verify] Statut paiement Moneroo (paymentInfo.data.status): ${paymentInfo.data?.status}`);

        const statusLower = paymentInfo.data?.status?.toLowerCase();
        const successStatuses = ['successful', 'success', 'completed', 'paid'];

        console.log(`🔍 [API /verify] Vérification statut: "${statusLower}" dans [${successStatuses.join(', ')}] ?`);

        if (successStatuses.includes(statusLower)) {
            console.log(`✅✅ [API /verify] PAIEMENT CONFIRMÉ PAR MONEROO !`);
            console.log(`💾 [API /verify] Mise à jour de la commande vers PAID...`);

            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: order.status === 'PENDING' ? 'VALIDATED' : order.status,
                    paymentStatus: 'PAID',
                    paidAt: new Date(),
                    monerooStatus: 'successful',
                    // Mise à jour des champs financiers
                    amountPaid: order.total,
                    remainingAmount: 0
                }
            });

            console.log(`✅ [API /verify] Commande ${orderId} mise à jour avec succès !`);
            console.log(`${'='.repeat(80)}\n`);

            return NextResponse.json({
                success: true,
                status: 'PAID',
                message: "Paiement validé avec succès"
            });
        }

        console.warn(`⚠️ [API /verify] Paiement NON finalisé. Statut Moneroo: ${paymentInfo.data?.status}`);
        console.log(`${'='.repeat(80)}\n`);

        return NextResponse.json({
            success: false,
            status: order.paymentStatus,
            monerooStatus: paymentInfo.data?.status,
            message: "Paiement non finalisé"
        });

    } catch (error: any) {
        console.error(`\n${'='.repeat(80)}`);
        console.error(`❌❌❌ [API /verify] ERREUR CRITIQUE`);
        console.error(`${'='.repeat(80)}`);
        console.error(`❌ [API /verify] Error:`, error);
        console.error(`❌ [API /verify] Message:`, error.message);
        console.error(`❌ [API /verify] Stack:`, error.stack);
        console.error(`${'='.repeat(80)}\n`);
        return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
    }
}
