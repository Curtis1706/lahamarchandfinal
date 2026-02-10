import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { PayoutService } from '@/lib/moneroo/payout-service';

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        console.log("🔔 WEBHOOK MONEROO REÇU");
        console.log("HEADERS:", Object.fromEntries(req.headers.entries()));
        console.log("BODY:", bodyText);

        const signature = req.headers.get('x-moneroo-signature');
        const secret = process.env.MONEROO_WEBHOOK_SECRET;

        if (!secret) {
            console.error("Webhook Secret non configuré");
            return NextResponse.json({ error: "Config Error" }, { status: 500 });
        }

        if (signature) {
            const hmac = crypto.createHmac('sha256', secret);
            const digest = hmac.update(bodyText).digest('hex');
            if (digest !== signature) {
                console.error("Signature invalide");
                return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
            }
        } else {
            console.warn("Signature manquante");
        }

        const event = JSON.parse(bodyText);
        const { type, data } = event;

        console.log(`Webhook Moneroo reçu: ${type}`, data.id);

        // Gestion des événements
        switch (type) {
            case 'payment.successful':
                await handlePaymentSuccess(data);
                break;
            case 'payment.failed':
                await handlePaymentFailed(data);
                break;
            case 'payout.successful':
                await handlePayoutSuccess(data);
                break;
            case 'payout.failed':
                await handlePayoutFailed(data);
                break;
            default:
                console.log(`Event non géré: ${type}`);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error("Erreur webhook:", error);
        return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
    }
}

async function handlePaymentSuccess(payment: any) {
    const orderId = payment.reference;
    if (!orderId) return;

    // Récupérer d'abord la commande pour obtenir le total
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { total: true }
    });

    if (!order) {
        console.error(`Commande ${orderId} introuvable pour le webhook.`);
        return;
    }

    // Utilisation de update avec types corrects (si prisma generate est ok)
    await prisma.order.update({
        where: { id: orderId },
        data: {
            status: 'VALIDATED',
            paymentStatus: 'PAID',
            paidAt: new Date(),
            monerooStatus: 'successful',
            // Mise à jour des champs financiers
            amountPaid: order.total,
            remainingAmount: 0
        }
    });

    console.log(`Commande ${orderId} payée avec succès.`);
}

async function handlePaymentFailed(payment: any) {
    const orderId = payment.reference;
    if (!orderId) return;

    await prisma.order.update({
        where: { id: orderId },
        data: {
            monerooStatus: 'failed'
        }
    });
    console.log(`Paiement échoué pour la commande ${orderId}.`);
}

async function handlePayoutSuccess(payout: any) {
    const reference = payout.external_reference;
    if (!reference) return;

    // Distinguer entre le nouveau modèle Withdrawal et l'ancien WithdrawalRequest
    if (reference.startsWith('WITHDRAWAL:')) {
        const withdrawalId = reference.split(':')[1];

        const withdrawal = await prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: 'PAID',
                paidAt: new Date()
            }
        });

        // Marquer les royalties comme payées (logique simplifiée)
        await PayoutService.markRoyaltiesAsPaid(withdrawal.userId, withdrawal.amount);
        console.log(`Retrait ${withdrawalId} payé avec succès (Modèle Withdrawal).`);

    } else {
        // Ancien modèle WithdrawalRequest
        const request = await prisma.withdrawalRequest.update({
            where: { id: reference },
            data: {
                status: 'completed',
                processedAt: new Date()
            }
        });

        if (request.userId) {
            await PayoutService.markRoyaltiesAsPaid(request.userId, request.amount);
        }
        console.log(`Retrait ${reference} payé avec succès (Modèle WithdrawalRequest).`);
    }
}

async function handlePayoutFailed(payout: any) {
    const reference = payout.external_reference;
    if (!reference) return;

    if (reference.startsWith('WITHDRAWAL:')) {
        const withdrawalId = reference.split(':')[1];
        await prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: 'REJECTED',
                rejectionReason: 'Échec du virement Moneroo'
            }
        });
    } else {
        await prisma.withdrawalRequest.update({
            where: { id: reference },
            data: {
                status: 'failed',
                failureReason: 'Echec virement Moneroo'
            }
        });
    }
}
