import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/authors/works - Créer une œuvre directement (workflow Auteur)
export async function POST(request: NextRequest) {
  console.log("🔍 API POST /authors/works - Création d'œuvre par Auteur");
  
  try {
    const body = await request.json();
    console.log("🔍 Body reçu:", body);
    
    const { 
      title, 
      disciplineId, 
      authorId, 
      isbn, 
      price, 
      stock, 
      minStock = 10,
      maxStock,
      description,
      status = "PENDING" // Les œuvres d'auteurs sont directement soumises pour validation
    } = body;
    
    console.log("🔍 Données extraites:", { title, disciplineId, authorId, isbn, status });

    // Validation des champs obligatoires
    if (!title || !disciplineId || !authorId || !isbn) {
      return NextResponse.json(
        { error: "Le titre, la discipline, l'auteur et l'ISBN sont obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier que l'auteur existe et a le bon rôle
    const author = await prisma.user.findUnique({
      where: { id: authorId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!author) {
      return NextResponse.json(
        { error: "Auteur non trouvé" },
        { status: 404 }
      );
    }

    if (author.role !== "AUTEUR") {
      return NextResponse.json(
        { error: "L'utilisateur doit avoir le rôle AUTEUR" },
        { status: 400 }
      );
    }

    // Vérifier que l'ISBN n'existe pas déjà
    const existingWork = await prisma.work.findUnique({
      where: { isbn }
    });

    if (existingWork) {
      return NextResponse.json(
        { error: "Une œuvre avec cet ISBN existe déjà" },
        { status: 400 }
      );
    }

    console.log("🔍 Tentative de création avec Prisma...");
    
    // Créer l'œuvre directement (pas de projet associé)
    const work = await prisma.work.create({
      data: {
        title: title.trim(),
        isbn: isbn.trim(),
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock),
        maxStock: maxStock ? parseInt(maxStock) : null,
        status: status, // PENDING par défaut pour validation PDG
        discipline: {
          connect: { id: disciplineId }
        },
        author: {
          connect: { id: authorId }
        }
        // Pas de projectId - œuvre directe d'un auteur
      },
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
      }
    });

    console.log("✅ Œuvre d'auteur créée, ajout des logs et notifications...");

    // Créer une notification pour le PDG
    try {
      const pdgUser = await prisma.user.findFirst({
        where: { role: "PDG" }
      });

      if (pdgUser) {
        await prisma.notification.create({
          data: {
            userId: pdgUser.id,
            title: "Nouvelle œuvre soumise par un Auteur",
            message: `L'auteur ${author.name} a soumis une nouvelle œuvre "${work.title}" pour validation.`,
            type: "WORK_SUBMITTED_FOR_VALIDATION",
            data: JSON.stringify({
              workId: work.id,
              workTitle: work.title,
              authorId: authorId,
              authorName: author.name,
              discipline: work.discipline.name,
              isbn: work.isbn,
              source: "AUTHOR_DIRECT_SUBMISSION"
            })
          }
        });
        console.log("✅ Notification créée pour le PDG");
      }
    } catch (notificationError) {
      console.error("⚠️ Erreur création notification PDG:", notificationError);
    }

    // Créer une notification pour l'auteur
    try {
      await prisma.notification.create({
        data: {
          userId: authorId,
          title: "Œuvre soumise avec succès",
          message: `Votre œuvre "${work.title}" a été soumise pour validation et sera examinée par l'équipe éditoriale.`,
          type: "WORK_SUBMITTED",
          data: JSON.stringify({
            workId: work.id,
            workTitle: work.title,
            status: status,
            source: "AUTHOR_DIRECT_SUBMISSION"
          })
        }
      });
      console.log("✅ Notification créée pour l'auteur");
    } catch (notificationError) {
      console.error("⚠️ Erreur création notification auteur:", notificationError);
    }

    // Créer un log d'audit
    try {
      await prisma.auditLog.create({
        data: {
          action: "WORK_CREATE_BY_AUTHOR",
          userId: authorId,
          performedBy: authorId,
          details: JSON.stringify({
            workId: work.id,
            workTitle: work.title,
            status: status,
            discipline: work.discipline.name,
            isbn: work.isbn,
            source: "AUTHOR_DIRECT_SUBMISSION"
          })
        }
      });
      console.log("✅ Log d'audit créé");
    } catch (auditError) {
      console.error("⚠️ Erreur création log d'audit:", auditError);
    }

    console.log("✅ Œuvre d'auteur créée avec succès:", work);
    
    return NextResponse.json(work, { status: 201 });
    
  } catch (error: any) {
    console.error("❌ Erreur création œuvre d'auteur:", error);
    console.error("❌ Stack:", error.stack);
    
    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Une œuvre avec cet ISBN existe déjà" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Erreur lors de la création de l'œuvre: " + error.message },
      { status: 500 }
    );
  }
}

// GET /api/authors/works - Récupérer les œuvres d'un auteur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('authorId');
    const status = searchParams.get('status');
    
    if (!authorId) {
      return NextResponse.json(
        { error: "ID de l'auteur requis" },
        { status: 400 }
      );
    }

    // Construire les filtres
    const where: any = {
      authorId: authorId
    };
    
    if (status && status !== "ALL") {
      where.status = status;
    }

    // Récupérer les œuvres de l'auteur
    const works = await prisma.work.findMany({
      where,
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
        },
        project: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        _count: {
          select: {
            orderItems: true,
            sales: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Calculer les statistiques
    const stats = await prisma.work.groupBy({
      by: ["status"],
      where: { authorId },
      _count: {
        id: true
      }
    });

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      works,
      stats: statusCounts,
      total: works.length
    });
  } catch (error) {
    console.error("Error fetching author works:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des œuvres de l'auteur" },
      { status: 500 }
    );
  }
}

