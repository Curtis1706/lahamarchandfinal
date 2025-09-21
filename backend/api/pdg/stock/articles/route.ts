import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log("📚 Creating new article...")
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
    console.log("📚 Article data received:", body)

    const {
      title,
      isbn,
      price,
      tva,
      stock,
      minStock,
      maxStock,
      disciplineId,
      authorId,
      concepteurId
    } = body

    // Validation des champs obligatoires
    if (!title || !price || !stock || !disciplineId) {
      return NextResponse.json({
        error: "Champs obligatoires manquants: title, price, stock, disciplineId"
      }, { status: 400 })
    }

    // Vérifier que la discipline existe
    const discipline = await prisma.discipline.findUnique({
      where: { id: disciplineId }
    })

    if (!discipline) {
      return NextResponse.json({
        error: "Discipline non trouvée"
      }, { status: 404 })
    }

    // Vérifier que l'auteur existe (si spécifié)
    if (authorId) {
      const author = await prisma.user.findUnique({
        where: { id: authorId, role: "AUTEUR" }
      })

      if (!author) {
        return NextResponse.json({
          error: "Auteur non trouvé"
        }, { status: 404 })
      }
    }

    // Vérifier que le concepteur existe (si spécifié)
    if (concepteurId) {
      const concepteur = await prisma.user.findUnique({
        where: { id: concepteurId, role: "CONCEPTEUR" }
      })

      if (!concepteur) {
        return NextResponse.json({
          error: "Concepteur non trouvé"
        }, { status: 404 })
      }
    }

    // Vérifier que l'ISBN n'existe pas déjà (si spécifié)
    if (isbn) {
      const existingWork = await prisma.work.findUnique({
        where: { isbn }
      })

      if (existingWork) {
        return NextResponse.json({
          error: "Un article avec cet ISBN existe déjà"
        }, { status: 409 })
      }
    }

    // Créer l'article
    const newWork = await prisma.work.create({
      data: {
        title,
        isbn: isbn || `AUTO-${Date.now()}`, // Générer un ISBN automatique si non fourni
        price: parseFloat(price),
        tva: tva ? parseFloat(tva) : 0.18, // 18% par défaut
        stock: parseInt(stock),
        minStock: minStock ? parseInt(minStock) : 10,
        maxStock: maxStock ? parseInt(maxStock) : null,
        disciplineId,
        authorId: authorId || null,
        concepteurId: concepteurId || null,
        status: "PUBLISHED",
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        discipline: true,
        author: true,
        concepteur: true
      }
    })

    // Créer un mouvement de stock initial
    await prisma.stockMovement.create({
      data: {
        workId: newWork.id,
        type: "INBOUND",
        quantity: parseInt(stock),
        reason: "Stock initial lors de la création",
        reference: "CREATION",
        performedBy: user.id
      }
    })

    console.log("✅ Article created successfully:", newWork.id)

    return NextResponse.json({
      success: true,
      work: newWork,
      message: "Article créé avec succès"
    })

  } catch (error) {
    console.error("❌ Error creating article:", error)
    
    // Log plus détaillé de l'erreur
    if (error instanceof Error) {
      console.error("❌ Error name:", error.name)
      console.error("❌ Error message:", error.message)
      console.error("❌ Error stack:", error.stack)
    }
    
    return NextResponse.json({
      error: "Erreur lors de la création de l'article",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
