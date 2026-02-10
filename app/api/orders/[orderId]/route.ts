import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: { orderId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { orderId } = params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        work: true
                    }
                },
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        }

        if (order.userId !== session.user.id && session.user.role !== 'PDG') {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        return NextResponse.json(order);

    } catch (error) {
        console.error("Erreur récupération commande:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
