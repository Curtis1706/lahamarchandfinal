import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/works/debug - Endpoint de diagnostic pour vérifier les works
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que c'est le PDG
    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Compter tous les works
    const totalCount = await prisma.work.count();
    
    // Récupérer tous les works sans relations (pour éviter les erreurs)
    const allWorks = await prisma.work.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        authorId: true,
        disciplineId: true,
        createdAt: true,
        isbn: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    // Essayer avec les relations
    let worksWithRelations: any[] = [];
    try {
      worksWithRelations = await prisma.work.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          discipline: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });
    } catch (relationError: any) {
      console.error("Erreur avec relations:", relationError);
    }

    return NextResponse.json({
      session: {
        id: session.user.id,
        role: session.user.role,
        email: session.user.email
      },
      totalWorksInDb: totalCount,
      worksWithoutRelations: allWorks,
      worksWithRelationsCount: worksWithRelations.length,
      worksWithRelations: worksWithRelations,
      message: "Diagnostic complet"
    }, { status: 200 });

  } catch (error: any) {
    console.error("Erreur dans /api/works/debug:", error);
    return NextResponse.json(
      { error: "Erreur lors du diagnostic: " + error.message },
      { status: 500 }
    );
  }
}

