import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

// GET /api/disciplines - Liste des disciplines
export async function GET(request: NextRequest) {
  try {
    const disciplines = await prisma.discipline.findMany({
      include: {
        _count: {
          select: {
            works: true,
            projects: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json(disciplines)
  } catch (error) {
    console.error("Error fetching disciplines:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/disciplines - Créer une discipline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const discipline = await prisma.discipline.create({
      data: {
        name
      }
    })

    return NextResponse.json(discipline, { status: 201 })
  } catch (error) {
    console.error("Error creating discipline:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
