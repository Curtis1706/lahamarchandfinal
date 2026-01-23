import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/concepteur/authors - Liste des auteurs pour le concepteur
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "CONCEPTEUR") {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        // Récupérer tous les auteurs actifs
        const authors = await prisma.user.findMany({
            where: {
                role: "AUTEUR",
                status: {
                    in: ["ACTIVE", "APPROVED"]
                }
            },
            select: {
                id: true,
                name: true,
                email: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(authors);
    } catch (error: any) {
        console.error("Error fetching authors:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des auteurs" },
            { status: 500 }
        );
    }
}
