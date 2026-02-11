import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Non autorisé" },
                { status: 401 }
            );
        }

        // Vérifier que l'utilisateur est PDG
        if (session.user.role !== "PDG") {
            return NextResponse.json(
                { error: "Accès non autorisé" },
                { status: 403 }
            );
        }

        const deliveryNote = await prisma.deliveryNote.findUnique({
            where: { id: params.id },
            include: {
                order: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                        items: {
                            include: {
                                work: {
                                    select: {
                                        title: true,
                                        isbn: true,
                                        price: true,
                                    },
                                },
                            },
                        },
                    },
                },
                generatedBy: {
                    select: {
                        name: true,
                    },
                },
                validatedBy: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!deliveryNote) {
            return NextResponse.json(
                { error: "Bon de sortie introuvable" },
                { status: 404 }
            );
        }

        // Formater les données
        const formattedNote = {
            id: deliveryNote.id,
            reference: deliveryNote.reference,
            status: deliveryNote.status,
            period: deliveryNote.period,
            createdAt: deliveryNote.createdAt.toISOString(),
            validatedAt: deliveryNote.validatedAt?.toISOString() || null,
            controlledAt: deliveryNote.controlledAt?.toISOString() || null,
            generatedBy: deliveryNote.generatedBy?.name || "N/A",
            validatedBy: deliveryNote.validatedBy?.name || null,
            controlledBy: null,
            order: {
                id: deliveryNote.order.id,
                reference: `CMD-${deliveryNote.order.id.slice(-8)}`,
                client: deliveryNote.order.user?.name || "N/A",
                clientEmail: deliveryNote.order.user?.email || "N/A",
                total: deliveryNote.order.total,
                items: deliveryNote.order.items.map((item: any) => ({
                    work: item.work?.title || "N/A",
                    isbn: item.work?.isbn || "N/A",
                    requestedQuantity: item.quantity,
                    deliveredQuantity: item.quantity,
                    price: item.price,
                })),
            },
        };

        return NextResponse.json({
            success: true,
            deliveryNote: formattedNote,
        });
    } catch (error) {
        console.error("Error fetching delivery note:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération du bon de sortie" },
            { status: 500 }
        );
    }
}
