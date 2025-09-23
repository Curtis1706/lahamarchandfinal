import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { UserStatus } from "@prisma/client"

// PUT /api/users/validate - Valider ou rejeter un utilisateur
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, status } = body

    // Validation
    if (!userId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Vérifier que le statut est valide
    const validStatuses = Object.values(UserStatus)
    if (!validStatuses.includes(status as UserStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Mettre à jour le statut de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        status: status as UserStatus,
        updatedAt: new Date()
      },
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
      }
    })

    return NextResponse.json({
      message: `User ${status.toLowerCase()} successfully`,
      user: updatedUser
    })
  } catch (error) {
    console.error("Error validating user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// GET /api/users/validate - Obtenir les utilisateurs en attente de validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'

    const users = await prisma.user.findMany({
      where: {
        status: status as UserStatus
      },
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
    console.error("Error fetching users for validation:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
