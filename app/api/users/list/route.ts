import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic'

// GET /api/users/list - Récupérer la liste des utilisateurs (pour messagerie)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // Filtrer par rôle
    const search = searchParams.get('search'); // Recherche par nom/email

    // Construire les conditions de recherche
    const whereConditions: any = {
      status: 'ACTIVE', // Seulement les utilisateurs actifs
      id: {
        not: session.user.id // Exclure l'utilisateur actuel
      }
    };

    // Filtrer par rôle si spécifié
    if (role && ['PDG', 'CONCEPTEUR', 'AUTEUR', 'REPRESENTANT', 'ADMIN'].includes(role)) {
      whereConditions.role = role;
    }

    // Recherche par nom ou email
    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Récupérer les utilisateurs
    const users = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' }
      ],
      take: 50 // Limiter à 50 utilisateurs pour éviter les listes trop longues
    });

    // Grouper par rôle pour faciliter l'affichage
    const usersByRole = users.reduce((acc: any, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});

    console.log(`✅ ${users.length} utilisateurs récupérés pour ${session.user.name}`);

    return NextResponse.json({
      users,
      usersByRole,
      total: users.length
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs: " + error.message },
      { status: 500 }
    );
  }
}
