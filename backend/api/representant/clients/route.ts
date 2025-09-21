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

    // Pour l'instant, on va simuler des clients
    // Dans une vraie application, on aurait un modèle Client avec une relation vers le représentant
    const clients = [
      {
        id: "client-1",
        name: "Librairie Centrale",
        type: "Librairie",
        contact: "Marie Dubois",
        email: "contact@librairie-centrale.ga",
        phone: "+241 01 23 45 67",
        address: "Avenue Léon Mba, Libreville",
        city: "Libreville",
        status: "Actif",
        totalOrders: 12,
        totalSpent: 1250000,
        lastOrder: "2024-01-15",
        notes: "Client fidèle, commande régulièrement"
      },
      {
        id: "client-2",
        name: "Point Lecture Owendo",
        type: "Point de vente",
        contact: "Jean Mba",
        email: "jean.mba@pointlecture.ga",
        phone: "+241 01 34 56 78",
        address: "Quartier Owendo, Libreville",
        city: "Owendo",
        status: "Actif",
        totalOrders: 8,
        totalSpent: 890000,
        lastOrder: "2024-01-12",
        notes: "Spécialisé dans les livres scolaires"
      },
      {
        id: "client-3",
        name: "Espace Livre Port-Gentil",
        type: "Librairie",
        contact: "Sophie Nguema",
        email: "sophie@espace-livre.ga",
        phone: "+241 02 45 67 89",
        address: "Centre-ville, Port-Gentil",
        city: "Port-Gentil",
        status: "En attente",
        totalOrders: 3,
        totalSpent: 450000,
        lastOrder: "2024-01-08",
        notes: "Nouveau client, potentiel élevé"
      },
      {
        id: "client-4",
        name: "Centre Culturel Franceville",
        type: "Institution",
        contact: "Pierre Obiang",
        email: "pierre@centre-culturel.ga",
        phone: "+241 01 56 78 90",
        address: "Avenue de l'Indépendance, Franceville",
        city: "Franceville",
        status: "Actif",
        totalOrders: 15,
        totalSpent: 2100000,
        lastOrder: "2024-01-18",
        notes: "Grande institution, commandes importantes"
      },
      {
        id: "client-5",
        name: "Librairie Universitaire",
        type: "Librairie",
        contact: "Dr. Alice Mvou",
        email: "alice@librairie-univ.ga",
        phone: "+241 01 67 89 01",
        address: "Campus universitaire, Libreville",
        city: "Libreville",
        status: "Actif",
        totalOrders: 22,
        totalSpent: 3200000,
        lastOrder: "2024-01-20",
        notes: "Spécialisé dans les ouvrages académiques"
      }
    ]

    // Calculer les statistiques
    const totalClients = clients.length
    const activeClients = clients.filter(c => c.status === "Actif").length
    const totalRevenue = clients.reduce((sum, client) => sum + client.totalSpent, 0)
    const averageOrderValue = clients.reduce((sum, client) => sum + (client.totalSpent / client.totalOrders), 0) / totalClients

    const response = {
      clients,
      summary: {
        total: totalClients,
        active: activeClients,
        pending: clients.filter(c => c.status === "En attente").length,
        totalRevenue: Math.round(totalRevenue),
        averageOrderValue: Math.round(averageOrderValue),
        topClient: clients.reduce((max, client) => 
          client.totalSpent > max.totalSpent ? client : max
        )
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
    const { name, type, contact, email, phone, address, city, notes } = body

    if (!name || !type || !contact) {
      return NextResponse.json({ error: "Nom, type et contact requis" }, { status: 400 })
    }

    // Dans une vraie application, on créerait le client en base
    // Pour l'instant, on simule la création
    const newClient = {
      id: `client-${Date.now()}`,
      name,
      type,
      contact,
      email: email || "",
      phone: phone || "",
      address: address || "",
      city: city || "",
      status: "Actif",
      totalOrders: 0,
      totalSpent: 0,
      lastOrder: null,
      notes: notes || "",
      createdAt: new Date().toISOString()
    }

    console.log("✅ Client created:", newClient.id)

    return NextResponse.json({ client: newClient }, { status: 201 })

  } catch (error) {
    console.error("❌ Error creating client:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du client" },
      { status: 500 }
    )
  }
}
