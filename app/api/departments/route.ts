import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const includeInactive = searchParams.get("includeInactive") === "true";

        // Construire les filtres
        const where: any = {};

        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        // Filtrer par statut actif si demandé
        if (!includeInactive) {
            where.isActive = true;
        }

        // Récupérer les départements avec les statistiques
        const departments = await (prisma as any).department.findMany({
            where,
            include: {
                _count: {
                    select: {
                        users: true,
                        clients: true
                    }
                }
            },
            orderBy: {
                name: "asc"
            }
        });

        logger.debug(`🔍 ${departments.length} département(s) trouvé(s)`);

        return NextResponse.json(departments);
    } catch (error) {
        logger.error("Error fetching departments:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des départements" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "PDG") {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        const body = await request.json();
        const { name, description } = body;

        if (!name?.trim()) {
            return NextResponse.json(
                { error: "Nom du département requis" },
                { status: 400 }
            );
        }

        // Vérifier que le département n'existe pas déjà
        const existing = await (prisma as any).department.findUnique({
            where: { name: name.trim() }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Un département avec ce nom existe déjà" },
                { status: 400 }
            );
        }

        // Créer le nouveau département
        const department = await (prisma as any).department.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                isActive: true
            },
            include: {
                _count: {
                    select: {
                        users: true,
                        clients: true
                    }
                }
            }
        });

        logger.debug(`✅ Département créé: "${department.name}"`);

        return NextResponse.json(department, { status: 201 });
    } catch (error: any) {
        logger.error("Error creating department:", error);
        return NextResponse.json(
            { error: "Erreur lors de la création du département: " + error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "PDG") {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        const body = await request.json();
        const { id, name, description, isActive } = body;

        if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

        const updated = await (prisma as any).department.update({
            where: { id },
            data: {
                name: name?.trim(),
                description: description?.trim(),
                isActive
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
