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
    const where: any = {
      // Exclure les collections (qui commencent par "Collection")
      NOT: {
        name: {
          startsWith: "Collection",
          mode: "insensitive"
        }
      }
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    // Filtrer par statut actif si demandé
    if (!includeInactive) {
      where.isActive = true;
    }

    // Récupérer les disciplines avec les statistiques
    const disciplines = await prisma.discipline.findMany({
      where,
      include: {
        _count: {
          select: {
            works: true,
            projects: true,
            users: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    logger.debug(`🔍 ${disciplines.length} discipline(s) trouvée(s)`);

    return NextResponse.json(disciplines);
  } catch (error) {
    logger.error("Error fetching disciplines:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des disciplines" },
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
        { error: "Nom de la discipline requis" },
        { status: 400 }
      );
    }

    // Vérifier que la discipline n'existe pas déjà
    const existingDiscipline = await prisma.discipline.findUnique({
      where: { name: name.trim() }
    });

    if (existingDiscipline) {
      return NextResponse.json(
        { error: "Une discipline avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Créer la nouvelle discipline
    const discipline = await prisma.discipline.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true
      },
      include: {
        _count: {
          select: {
            works: true,
            projects: true,
            users: true
          }
        }
      }
    });

    logger.debug(`✅ Discipline créée: "${discipline.name}"`);

    // Créer un log d'audit

    return NextResponse.json(discipline, { status: 201 });
  } catch (error: any) {
    logger.error("Error creating discipline:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la discipline: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "PDG") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de la discipline requis" },
        { status: 400 }
      );
    }

    // Vérifier que la discipline existe
    const existingDiscipline = await prisma.discipline.findUnique({
      where: { id }
    });

    if (!existingDiscipline) {
      return NextResponse.json(
        { error: "Discipline non trouvée" },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json(
          { error: "Nom de la discipline requis" },
          { status: 400 }
        );
      }

      // Vérifier que le nouveau nom n'existe pas déjà
      const nameExists = await prisma.discipline.findFirst({
        where: {
          name: name.trim(),
          id: { not: id }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Une discipline avec ce nom existe déjà" },
          { status: 400 }
        );
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Mettre à jour la discipline
    const updatedDiscipline = await prisma.discipline.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            works: true,
            projects: true,
            users: true
          }
        }
      }
    });

    logger.debug(`✅ Discipline mise à jour: "${updatedDiscipline.name}"`);

    return NextResponse.json(updatedDiscipline);
  } catch (error: any) {
    logger.error("Error updating discipline:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la discipline: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "PDG") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const force = searchParams.get("force") === "true";

    if (!id) {
      return NextResponse.json(
        { error: "ID de la discipline requis" },
        { status: 400 }
      );
    }

    // Vérifier que la discipline existe
    const existingDiscipline = await prisma.discipline.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            works: true,
            projects: true,
            users: true
          }
        }
      }
    });

    if (!existingDiscipline) {
      return NextResponse.json(
        { error: "Discipline non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier les contraintes d'intégrité (sauf si force=true)
    if (!force) {
      if (existingDiscipline._count.works > 0) {
        return NextResponse.json(
          { error: "Impossible de supprimer cette discipline car elle a des œuvres associées. Utilisez 'force=true' pour forcer la suppression." },
          { status: 400 }
        );
      }

      if (existingDiscipline._count.projects > 0) {
        return NextResponse.json(
          { error: "Impossible de supprimer cette discipline car elle a des projets associés. Utilisez 'force=true' pour forcer la suppression." },
          { status: 400 }
        );
      }

      if (existingDiscipline._count.users > 0) {
        return NextResponse.json(
          { error: "Impossible de supprimer cette discipline car elle a des utilisateurs associés. Utilisez 'force=true' pour forcer la suppression." },
          { status: 400 }
        );
      }
    }

    // Supprimer la discipline
    await prisma.discipline.delete({
      where: { id }
    });

    logger.debug(`✅ Discipline supprimée: "${existingDiscipline.name}"`);

    return NextResponse.json({ message: "Discipline supprimée avec succès" });
  } catch (error: any) {
    logger.error("Error deleting discipline:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la discipline: " + error.message },
      { status: 500 }
    );
  }
}
