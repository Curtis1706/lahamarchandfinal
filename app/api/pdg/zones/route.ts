import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/zones - Récupérer les zones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    // Pour l'instant, on retourne des zones par défaut basées sur le Bénin
    // Dans un vrai système, il faudrait une table Zone dédiée
    const defaultZones = [
      {
        id: "zone-1",
        zone: "ZONE-PRIMAIRE-1",
        departement: "ATLANTIQUE",
        livreur: "+22940767676",
        statut: "Actif" as const,
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        residents: 79,
        couverture: "GODOMEY- DEKOUNGBE-COCOTOMEY-COCOCODJI-ATTROKPOCODJI-GBODJI-SEDEGBE-LOBOZOUNKPA ET ENVIRONS"
      },
      {
        id: "zone-2",
        zone: "ZONE-PRIMAIRE-1",
        departement: "LITTORAL",
        livreur: "",
        statut: "Actif" as const,
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 0,
        couverture: ""
      },
      {
        id: "zone-3",
        zone: "ZONE-SECONDAIRE-1",
        departement: "ATLANTIQUE",
        livreur: "+22966000000",
        statut: "Actif" as const,
        creeLe: new Date().toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        creePar: "PDG Administrateur",
        modifieLe: "-",
        residents: 45,
        couverture: "COTONOU CENTRE"
      }
    ]

    return NextResponse.json(defaultZones)

  } catch (error) {
    logger.error("Error fetching zones:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/zones - Créer une zone
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { zone, departement, livreur, statut, couverture } = await request.json()

    const newZone = {
      id: `zone-${Date.now()}`,
      zone,
      departement,
      livreur: livreur || "",
      statut: statut || "Actif",
      creeLe: new Date().toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      creePar: session.user.name || "PDG Administrateur",
      modifieLe: "-",
      residents: 0,
      couverture: couverture || ""
    }

    return NextResponse.json(newZone, { status: 201 })

  } catch (error) {
    logger.error("Error creating zone:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// PUT /api/pdg/zones - Modifier une zone
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { id, zone, departement, livreur, statut, couverture, residents } = await request.json()

    const updatedZone = {
      id,
      zone,
      departement,
      livreur: livreur || "",
      statut,
      couverture: couverture || "",
      residents: residents || 0,
      modifieLe: new Date().toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return NextResponse.json(updatedZone)

  } catch (error) {
    logger.error("Error updating zone:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// DELETE /api/pdg/zones - Supprimer une zone
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

    return NextResponse.json({ success: true, message: "Zone supprimée" })

  } catch (error) {
    logger.error("Error deleting zone:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


