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

    // Compter tous les works avec SQL brut (pour éviter les problèmes d'enum)
    let totalCount = 0;
    try {
      const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "Work"`
      );
      totalCount = Number(countResult[0]?.count || 0);
    } catch (countError: any) {
      console.error("Erreur lors du comptage:", countError);
    }
    
    // Récupérer tous les works avec SQL brut (pour éviter les problèmes d'enum)
    let allWorks: any[] = [];
    let worksWithRelations: any[] = [];
    
    try {
      // Utiliser SQL brut pour éviter les problèmes d'enum SUSPENDED
      const worksRaw = await prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          w.id, w.title, w.status, w."authorId", w."disciplineId", w."createdAt", w.isbn,
          u1.id as "author_id", u1.name as "author_name", u1.email as "author_email", u1.role as "author_role",
          d.id as "discipline_id", d.name as "discipline_name"
        FROM "Work" w
        LEFT JOIN "User" u1 ON w."authorId" = u1.id
        LEFT JOIN "Discipline" d ON w."disciplineId" = d.id
        ORDER BY w."createdAt" DESC
        LIMIT 50`
      );
      
      if (worksRaw && Array.isArray(worksRaw)) {
        allWorks = worksRaw.map((row: any) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          authorId: row.authorId,
          disciplineId: row.disciplineId,
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
          isbn: row.isbn
        }));
        
        // Works avec relations (premiers 10)
        worksWithRelations = worksRaw.slice(0, 10).map((row: any) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          authorId: row.authorId,
          disciplineId: row.disciplineId,
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
          isbn: row.isbn,
          author: row.author_id ? {
            id: row.author_id,
            name: row.author_name,
            email: row.author_email,
            role: row.author_role
          } : null,
          discipline: row.discipline_id ? {
            id: row.discipline_id,
            name: row.discipline_name
          } : null
        }));
      }
    } catch (findError: any) {
      console.error("Erreur lors de la récupération des works:", findError);
      console.error("Stack:", findError.stack);
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
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Erreur lors du diagnostic: " + (error.message || "Erreur inconnue"),
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

