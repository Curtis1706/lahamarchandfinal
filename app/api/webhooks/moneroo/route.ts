import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { PayoutService } from '@/lib/moneroo/payout-service';

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
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

    // Utilisation de update avec types corrects (si prisma generate est ok)
    await prisma.order.update({
        where: { id: orderId },
        data: {
            status: 'VALIDATED',
            paymentStatus: 'PAID',
            paidAt: new Date(),
            monerooStatus: 'successful'
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
    // data.external_reference contient withdrawalRequest.id
    const requestId = payout.external_reference;
    if (!requestId) return;

    const request = await prisma.withdrawalRequest.update({
        where: { id: requestId },
        data: {
            status: 'completed',
            processedAt: new Date()
        }
    });

    if (request.userId) {
        await PayoutService.markRoyaltiesAsPaid(request.userId, request.amount);
    }
}

async function handlePayoutFailed(payout: any) {
    const requestId = payout.external_reference;
    if (!requestId) return;

    await prisma.withdrawalRequest.update({
        where: { id: requestId },
        data: {
            status: 'failed',
            failureReason: 'Echec virement Moneroo'
        }
    });
}
