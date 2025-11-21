import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pdg/clients - Récupérer tous les clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    // Récupérer tous les clients depuis la base de données
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // Formater les données pour le frontend
    const formattedClients = clients.map(client => ({
      id: client.id,
      nom: client.nom,
      telephone: client.telephone || "",
      type: client.type,
      departement: client.departement || "",
      statut: client.statut === 'ACTIF' ? 'Actif' : client.statut === 'EN_ATTENTE' ? 'En attente' : 'Inactif',
      creeLe: client.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dette: client.dette
    }))

    return NextResponse.json(formattedClients)

  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST /api/pdg/clients - Créer un nouveau client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const body = await request.json()
    const { nom, telephone, email, type, departement, address, city, contact, notes } = body

    if (!nom || !type) {
      return NextResponse.json({ error: "Nom et type requis" }, { status: 400 })
    }

    // Créer le client dans la base de données
    const newClient = await prisma.client.create({
      data: {
        nom,
        telephone: telephone || "",
        email: email || "",
        type,
        departement: departement || "",
        address: address || "",
        city: city || "",
        contact: contact || "",
        notes: notes || "",
        statut: "ACTIF",
        createdBy: session.user.id
      }
    })

    return NextResponse.json({
      id: newClient.id,
      nom: newClient.nom,
      telephone: newClient.telephone,
      type: newClient.type,
      departement: newClient.departement,
      statut: "Actif",
      creeLe: newClient.createdAt.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dette: 0
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


