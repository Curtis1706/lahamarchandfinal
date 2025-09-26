import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    // Construire les filtres
    const where: any = {};
    
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
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

    return NextResponse.json(disciplines);
  } catch (error) {
    console.error("Error fetching disciplines:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des disciplines" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nom de la discipline requis" },
        { status: 400 }
      );
    }

    // Vérifier que la discipline n'existe pas déjà
    const existingDiscipline = await prisma.discipline.findUnique({
      where: { name }
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
        // Note: Si vous voulez ajouter une description, il faudra modifier le schéma Prisma
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

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: "DISCIPLINE_CREATE",
        performedBy: "PDG", // En production, récupérer l'ID du PDG connecté
        details: JSON.stringify({
          disciplineId: discipline.id,
          disciplineName: discipline.name,
          timestamp: new Date().toISOString()
        })
      }
    });

    return NextResponse.json(discipline);
  } catch (error) {
    console.error("Error creating discipline:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la discipline" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID et nom de la discipline requis" },
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

    // Mettre à jour la discipline
    const updatedDiscipline = await prisma.discipline.update({
      where: { id },
      data: {
        name: name.trim()
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

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: "DISCIPLINE_UPDATE",
        performedBy: "PDG", // En production, récupérer l'ID du PDG connecté
        details: JSON.stringify({
          disciplineId: id,
          oldName: existingDiscipline.name,
          newName: name.trim(),
          timestamp: new Date().toISOString()
        })
      }
    });

    return NextResponse.json(updatedDiscipline);
  } catch (error) {
    console.error("Error updating discipline:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la discipline" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

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

    // Vérifier les contraintes d'intégrité
    if (existingDiscipline._count.works > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer cette discipline car elle a des œuvres associées" },
        { status: 400 }
      );
    }

    if (existingDiscipline._count.projects > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer cette discipline car elle a des projets associés" },
        { status: 400 }
      );
    }

    if (existingDiscipline._count.users > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer cette discipline car elle a des utilisateurs associés" },
        { status: 400 }
      );
    }

    // Supprimer la discipline
    await prisma.discipline.delete({
      where: { id }
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: "DISCIPLINE_DELETE",
        performedBy: "PDG", // En production, récupérer l'ID du PDG connecté
        details: JSON.stringify({
          disciplineId: id,
          disciplineName: existingDiscipline.name,
          timestamp: new Date().toISOString()
        })
      }
    });

    return NextResponse.json({ message: "Discipline supprimée avec succès" });
  } catch (error) {
    console.error("Error deleting discipline:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la discipline" },
      { status: 500 }
    );
  }
}