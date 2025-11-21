import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Getting current user...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un représentant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "REPRESENTANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    console.log("✅ User found:", user.name, user.role)

    // Récupérer les clients depuis la base de données
    const clients = await prisma.client.findMany({
      where: {
        representantId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formater les données pour le frontend
    const formattedClients = clients.map(client => ({
      id: client.id,
      name: client.nom,
      type: client.type,
      contact: client.contact || "",
      email: client.email || "",
      phone: client.telephone || "",
      address: client.address || "",
      city: client.city || "",
      status: client.statut === 'ACTIF' ? 'Actif' : client.statut === 'EN_ATTENTE' ? 'En attente' : 'Inactif',
      totalOrders: client.totalOrders,
      totalSpent: client.totalSpent,
      lastOrder: client.lastOrder?.toISOString().split('T')[0] || null,
      notes: client.notes || ""
    }))

    // Calculer les statistiques
    const totalClients = formattedClients.length
    const activeClients = formattedClients.filter(c => c.status === "Actif").length
    const totalRevenue = formattedClients.reduce((sum, client) => sum + client.totalSpent, 0)
    const averageOrderValue = totalClients > 0 
      ? formattedClients.reduce((sum, client) => sum + (client.totalOrders > 0 ? client.totalSpent / client.totalOrders : 0), 0) / totalClients
      : 0

    const response = {
      clients: formattedClients,
      summary: {
        total: totalClients,
        active: activeClients,
        pending: formattedClients.filter(c => c.status === "En attente").length,
        totalRevenue: Math.round(totalRevenue),
        averageOrderValue: Math.round(averageOrderValue),
        topClient: formattedClients.length > 0
          ? formattedClients.reduce((max, client) => 
              client.totalSpent > max.totalSpent ? client : max
            )
          : null
      }
    }

    console.log("✅ Clients data prepared:", {
      totalClients,
      activeClients,
      totalRevenue: Math.round(totalRevenue)
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error("❌ Error fetching clients:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des clients" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Creating new client...")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un représentant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || user.role !== "REPRESENTANT") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, contact, email, phone, address, city, notes, departement } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Nom et type requis" }, { status: 400 })
    }

    // Créer le client dans la base de données
    const newClient = await prisma.client.create({
      data: {
        nom: name,
        type,
        contact: contact || "",
        email: email || "",
        telephone: phone || "",
        address: address || "",
        city: city || "",
        departement: departement || "",
        notes: notes || "",
        statut: "ACTIF",
        representantId: user.id,
        createdBy: user.id,
        totalOrders: 0,
        totalSpent: 0
      }
    })

    console.log("✅ Client created:", newClient.id)

    // Formater la réponse
    const formattedClient = {
      id: newClient.id,
      name: newClient.nom,
      type: newClient.type,
      contact: newClient.contact || "",
      email: newClient.email || "",
      phone: newClient.telephone || "",
      address: newClient.address || "",
      city: newClient.city || "",
      status: "Actif",
      totalOrders: 0,
      totalSpent: 0,
      lastOrder: null,
      notes: newClient.notes || "",
      createdAt: newClient.createdAt.toISOString()
    }

    return NextResponse.json({ client: formattedClient }, { status: 201 })

  } catch (error) {
    console.error("❌ Error creating client:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    )
  }
}
