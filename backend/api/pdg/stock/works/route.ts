import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
  try {
    console.log("🔍 Updating work stock settings...")
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

    const body = await request.json()
    const { workId, minStock, maxStock, price } = body

    if (!workId) {
      return NextResponse.json({ error: "workId requis" }, { status: 400 })
    }

    // Vérifier que l'œuvre existe
    const work = await prisma.work.findUnique({
      where: { id: workId }
    })

    if (!work) {
      return NextResponse.json({ error: "Œuvre introuvable" }, { status: 404 })
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      updatedAt: new Date()
    }

    if (minStock !== undefined) updateData.minStock = minStock
    if (maxStock !== undefined) updateData.maxStock = maxStock
    if (price !== undefined) updateData.price = price

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

    console.log("✅ Work stock settings updated:", updatedWork.id)

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error updating work stock settings:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des paramètres de stock" },
      { status: 500 }
    )
  }
}
