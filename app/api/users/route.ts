import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Role, UserStatus } from "@prisma/client"

// GET /api/users - Liste des utilisateurs
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        disciplineId: true,
        discipline: {
          select: {
            id: true,
            name: true,
          }
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/users - Créer un utilisateur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, phone, disciplineId } = body

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Créer l'utilisateur
    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: role as Role,
        status: 'ACTIVE', // Les utilisateurs créés par le PDG sont actifs par défaut
        disciplineId: disciplineId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        disciplineId: true,
        discipline: {
          select: {
            id: true,
            name: true,
          }
        },
        createdAt: true,
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/users - Mettre à jour un utilisateur
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email, phone, role, status, disciplineId } = body

    // Validation
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(role && { role: role as Role }),
        ...(status && { status: status as any }),
        ...(disciplineId !== undefined && { disciplineId }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        disciplineId: true,
        discipline: {
          select: {
            id: true,
            name: true,
          }
        },
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/users - Supprimer un utilisateur
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    // Validation
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        authoredWorks: true,
        conceivedWorks: true,
        orders: true,
        royalties: true,
        partner: true,
      }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Vérifier si l'utilisateur a des relations importantes
    const hasImportantRelations = 
      existingUser.authoredWorks.length > 0 ||
      existingUser.conceivedWorks.length > 0 ||
      existingUser.orders.length > 0 ||
      existingUser.royalties.length > 0 ||
      existingUser.partner

    if (hasImportantRelations) {
      return NextResponse.json({ 
        error: "Impossible de supprimer un utilisateur ayant des œuvres, commandes ou partenariats. Veuillez d'abord archiver ou transférer ces éléments." 
      }, { status: 400 })
    }

    // Supprimer l'utilisateur de la base de données
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
