import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/concepteur/categories - Liste des catégories pour le concepteur
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== "CONCEPTEUR") {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        // Récupérer toutes les catégories actives
        const categories = await prisma.category.findMany({
            where: {
                isActive: true // Seulement les catégories actives
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

        return NextResponse.json(categories);

    } catch (error: any) {
        console.error("Error fetching categories:", error);
        // En cas d'erreur, retourner un tableau vide pour ne pas bloquer le formulaire
        return NextResponse.json([], { status: 200 });
    }
}
