import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PayoutService } from '@/lib/moneroo/payout-service';
import { z } from 'zod';

const withdrawalSchema = z.object({
    amount: z.number().positive().min(500),
    method: z.enum(['mobile_money', 'bank_transfer']),
    phoneNumber: z.string().optional(),
    provider: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountName: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const body = await req.json();

        const validation = withdrawalSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Données invalides", details: validation.error.format() }, { status: 400 });
        }

        const data = validation.data;

        if (data.method === 'mobile_money' && (!data.phoneNumber || !data.provider)) {
            return NextResponse.json({ error: "Numéro et opérateur requis pour Mobile Money" }, { status: 400 });
        }

        const result = await PayoutService.requestPayout(session.user.id, {
            amount: data.amount,
            method: data.method,
            phoneNumber: data.phoneNumber,
            provider: data.provider,
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            accountName: data.accountName
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Erreur demande retrait:", error);
        return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
    }
}
