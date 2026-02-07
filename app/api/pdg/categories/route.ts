import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/categories - Récupérer les catégories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Permettre l'accès aux PDG, clients et auteurs (pour créer des œuvres)
    if (session.user.role !== "PDG" && session.user.role !== "CLIENT" && session.user.role !== "AUTEUR") {
      return NextResponse.json({ error: "Forbidden - PDG, CLIENT or AUTEUR role required" }, { status: 403 })
    }

    // Filtrer uniquement les catégories actives pour les clients et auteurs
    const whereClause = (session.user.role === "CLIENT" || session.user.role === "AUTEUR")
      ? { isActive: true }
      : {}

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    const formattedCategories = categories.map(category => ({
      id: category.id,
      nom: category.name,
      description: category.description || "",
      statut: category.isActive ? 'Disponible' : 'Indisponible',
      creeLe: category.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: category.createdBy,
      modifieLe: category.updatedAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))

    return NextResponse.json(formattedCategories)

  } catch (error) {
    logger.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/categories - Créer une catégorie
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

    if (!nom || !nom.trim()) {
      return NextResponse.json({ 
        error: "Le nom de la catégorie est obligatoire" 
      }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name: nom.trim(),
        description: description?.trim() || "",
        isActive: statut === 'Disponible',
        createdBy: session.user.name || "PDG Administrateur"
      }
    })

    // Audit log
    try {
    } catch (auditError) {
      logger.error("⚠️ Erreur lors de la création de l'audit log:", auditError)
      // Ne pas bloquer la création de la catégorie si l'audit log échoue
    }

    // Retourner le format attendu par le frontend
    const formattedCategory = {
      id: category.id,
      nom: category.name,
      description: category.description || "",
      statut: category.isActive ? 'Disponible' : 'Indisponible',
      creeLe: category.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: category.createdBy || "PDG Administrateur",
      modifieLe: category.updatedAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return NextResponse.json(formattedCategory, { status: 201 })

  } catch (error: any) {
    logger.error("Error creating category:", error)
    
    // Gérer l'erreur de contrainte unique (P2002)
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Cette catégorie existe déjà dans le système" 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Erreur lors de la création de la catégorie",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// PUT /api/pdg/categories/[id] - Modifier une catégorie
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

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: nom,
        description: description || "",
        isActive: statut === 'Disponible',
        updatedAt: new Date()
      }
    })

    // Audit log

    return NextResponse.json(category)

  } catch (error) {
    logger.error("Error updating category:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

