import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

// GET /api/works - Liste des œuvres
export async function GET(request: NextRequest) {
  try {
    const works = await prisma.work.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        discipline: true,
        sales: true,
        royalties: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(works)
  } catch (error) {
    console.error("Error fetching works:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/works - Créer une œuvre
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, isbn, price, disciplineId, authorId, concepteurId } = body

    // Validation
    if (!title || !price || !disciplineId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const work = await prisma.work.create({
      data: {
        title,
        isbn,
        price: parseFloat(price),
        disciplineId,
        concepteurId: concepteurId || null,
        authorId: authorId || null,
        status: "SUBMITTED"
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        concepteur: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        discipline: true,
      }
    })

    return NextResponse.json(work, { status: 201 })
  } catch (error) {
    console.error("Error creating work:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
