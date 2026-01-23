import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/concepteur/collections - Liste des collections pour le concepteur
// Note: Les collections sont stockées dans la table Discipline avec le nom contenant "Collection"
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "CONCEPTEUR") {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        // Récupérer les disciplines qui sont des collections (name contient "Collection")
        const collections = await prisma.discipline.findMany({
            where: {
                name: {
                    contains: "Collection"
                },
                isActive: true // Seulement les collections actives
            },
            select: {
                id: true,
                name: true,
                description: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(collections);

    } catch (error: any) {
        console.error("Error fetching collections:", error);
        // En cas d'erreur, retourner un tableau vide pour ne pas bloquer le formulaire
        return NextResponse.json([], { status: 200 });
    }
}
