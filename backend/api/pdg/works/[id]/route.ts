import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 Updating work...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un PDG
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "PDG") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const workId = params.id
    const body = await request.json()
    const { title, isbn, price, tva, disciplineId } = body

    if (!title || !isbn || !price) {
      return NextResponse.json({ error: "title, isbn et price requis" }, { status: 400 })
    }

    // Vérifier que l'œuvre existe
    const existingWork = await prisma.work.findUnique({
      where: { id: workId }
    })

    if (!existingWork) {
      return NextResponse.json({ error: "Œuvre introuvable" }, { status: 404 })
    }

    // Vérifier que l'ISBN n'est pas déjà utilisé par une autre œuvre
    if (isbn !== existingWork.isbn) {
      const isbnExists = await prisma.work.findUnique({
        where: { isbn }
      })

      if (isbnExists) {
        return NextResponse.json({ error: "Cet ISBN est déjà utilisé par une autre œuvre" }, { status: 400 })
      }
    }

    // Vérifier que la discipline existe si fournie
    if (disciplineId && disciplineId !== existingWork.disciplineId) {
      const discipline = await prisma.discipline.findUnique({
        where: { id: disciplineId }
      })

      if (!discipline) {
        return NextResponse.json({ error: "Discipline introuvable" }, { status: 400 })
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      title,
      isbn,
      price: parseFloat(price),
      updatedAt: new Date()
    }

    if (tva !== undefined) updateData.tva = parseFloat(tva)
    if (disciplineId) updateData.disciplineId = disciplineId

    // Mettre à jour l'œuvre
    const updatedWork = await prisma.work.update({
      where: { id: workId },
      data: updateData,
      include: {
        discipline: true,
        author: true,
        concepteur: true
      }
    })

    const response = {
      work: {
        id: updatedWork.id,
        title: updatedWork.title,
        isbn: updatedWork.isbn,
        stock: updatedWork.stock,
        minStock: updatedWork.minStock,
        maxStock: updatedWork.maxStock,
        price: updatedWork.price,
        tva: updatedWork.tva,
        status: updatedWork.status,
        discipline: {
          id: updatedWork.discipline.id,
          name: updatedWork.discipline.name
        },
        author: updatedWork.author ? {
          id: updatedWork.author.id,
          name: updatedWork.author.name,
          email: updatedWork.author.email
        } : null,
        concepteur: updatedWork.concepteur ? {
          id: updatedWork.concepteur.id,
          name: updatedWork.concepteur.name,
          email: updatedWork.concepteur.email
        } : null,
        totalValue: updatedWork.price * updatedWork.stock,
        stockStatus: updatedWork.stock === 0 ? "out" : updatedWork.stock <= updatedWork.minStock ? "low" : "available"
      }
    }

    console.log("✅ Work updated:", updatedWork.id)

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error updating work:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'œuvre" },
      { status: 500 }
    )
  }
}
