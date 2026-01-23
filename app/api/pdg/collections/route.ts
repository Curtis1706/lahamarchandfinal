import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/collections - Récupérer les collections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Permettre l'accès aux PDG et aux auteurs (pour créer des œuvres)
    if (session.user.role !== "PDG" && session.user.role !== "AUTEUR") {
      return NextResponse.json({ error: "Forbidden - PDG or AUTEUR role required" }, { status: 403 })
    }

    // Pour l'instant, on utilise les disciplines comme collections
    // Dans un vrai système, il faudrait une table Collection dédiée
    const collections = await prisma.discipline.findMany({
      where: {
        name: {
          contains: "Collection"
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Si pas de collections trouvées, créer des collections par défaut
    if (collections.length === 0) {
      const defaultCollections = [
        {
          id: "collection-laha",
          nom: "Collection LAHA",
          description: "Collection principale LAHA Marchand",
          statut: "Disponible",
          creeLe: new Date().toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          creePar: "PDG Administrateur",
          modifieLe: "-"
        },
        {
          id: "collection-citoyenne",
          nom: "Collection citoyenne",
          description: "Collection éducative citoyenne",
          statut: "Disponible",
          creeLe: new Date().toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          creePar: "PDG Administrateur",
          modifieLe: "-"
        },
        {
          id: "collection-vitale",
          nom: "Collection vitale",
          description: "Collection essentielle",
          statut: "Disponible",
          creeLe: new Date().toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          creePar: "PDG Administrateur",
          modifieLe: "-"
        }
      ]
      return NextResponse.json(defaultCollections)
    }

    const formattedCollections = collections.map(collection => ({
      id: collection.id,
      nom: collection.name,
      description: collection.description || "",
      statut: collection.isActive ? 'Disponible' : 'Indisponible',
      creeLe: collection.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: "PDG Administrateur",
      modifieLe: collection.updatedAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))

    return NextResponse.json(formattedCollections)

  } catch (error) {
    logger.error("Error fetching collections:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/collections - Créer une collection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Permettre l'accès aux PDG et aux auteurs (pour créer des œuvres)
    if (session.user.role !== "PDG" && session.user.role !== "AUTEUR") {
      return NextResponse.json({ error: "Forbidden - PDG or AUTEUR role required" }, { status: 403 })
    }

    const { nom, description, statut } = await request.json()

    const collection = await prisma.discipline.create({
      data: {
        name: `Collection ${nom}`,
        description: description || "",
        isActive: statut === 'Disponible'
      }
    })

    return NextResponse.json(collection, { status: 201 })

  } catch (error: any) {
    logger.error("Error creating collection:", error)
    
    // Gérer l'erreur de contrainte unique (P2002)
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Cette collection existe déjà dans le système" 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Erreur lors de la création de la collection",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

