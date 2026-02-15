import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PayoutService } from '@/lib/moneroo/payout-service';


export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const balance = await PayoutService.getAvailableBalance(session.user.id);

        return NextResponse.json({ balance });

    } catch (error: any) {
        console.error("Error fetching balance:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
