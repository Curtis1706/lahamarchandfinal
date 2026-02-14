import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/departements - Récupérer les départements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    // Récupérer les départements depuis la base de données
    const departments = await (prisma as any).department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    // Mapper vers le format attendu par le frontend
    const formattedDepartments = departments.map((dept: any) => ({
      id: dept.id,
      nom: dept.name,
      responsable: "-",
      chef: "-",
      statut: dept.isActive ? "Actif" : "Inactif",
      description: dept.description || "",
      creeLe: dept.createdAt.toLocaleDateString('fr-FR'),
      modifieLe: dept.updatedAt.toLocaleDateString('fr-FR'),
      residents: (dept as any)._count?.users || 0
    }))

    return NextResponse.json(formattedDepartments)

  } catch (error) {
    logger.error("Error fetching departments:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/departements - Créer un département
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { nom, description, statut } = await request.json()

    const newDepartment = await (prisma as any).department.create({
      data: {
        name: nom,
        description: description || "",
        isActive: statut === "Actif"
      }
    })

    return NextResponse.json({
      id: newDepartment.id,
      nom: newDepartment.name,
      responsable: "-",
      chef: "-",
      statut: newDepartment.isActive ? "Actif" : "Inactif",
      description: newDepartment.description || "",
      creeLe: newDepartment.createdAt.toLocaleDateString('fr-FR'),
      modifieLe: newDepartment.updatedAt.toLocaleDateString('fr-FR'),
      residents: 0
    }, { status: 201 })

  } catch (error) {
    logger.error("Error creating department:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/pdg/departements - Modifier un département
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { id, nom, description, statut } = await request.json()

    const updatedDepartment = await (prisma as any).department.update({
      where: { id },
      data: {
        name: nom,
        description: description || "",
        isActive: statut === "Actif"
      },
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    return NextResponse.json({
      id: updatedDepartment.id,
      nom: updatedDepartment.name,
      responsable: "-",
      chef: "-",
      statut: updatedDepartment.isActive ? "Actif" : "Inactif",
      description: updatedDepartment.description || "",
      creeLe: updatedDepartment.createdAt.toLocaleDateString('fr-FR'),
      modifieLe: updatedDepartment.updatedAt.toLocaleDateString('fr-FR'),
      residents: (updatedDepartment as any)._count?.users || 0
    })

  } catch (error) {
    logger.error("Error updating department:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/pdg/departements - Supprimer un département
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    await (prisma as any).department.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: "Département supprimé" })

  } catch (error) {
    logger.error("Error deleting department:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


