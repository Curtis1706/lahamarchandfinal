import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPaginationParams } from "@/lib/pagination"

// GET /api/representant/clients - Récupérer les clients du représentant
export async function GET(request: NextRequest) {
  try {
    logger.debug("🔍 Getting current user...")
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

    logger.debug("✅ User found:", user.name, user.role)

    // Paramètres de pagination
    const { searchParams } = new URL(request.url)
    const paginationParams = getPaginationParams(searchParams, 50)
    
    // Filtres de recherche
    const search = searchParams.get('search')
    const statut = searchParams.get('statut')
    
    // Construire la clause where
    const whereClause: any = {
      representantId: user.id
    }
    
    // Ajouter filtres si présents
    if (search) {
      whereClause.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (statut) {
      whereClause.statut = statut
    }

    // Paginer les clients
    const paginatedResult = await paginateQuery(
      paginationParams,
      {
        where: whereClause,
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          statut: true,
          type: true,
          createdAt: true,
          totalOrders: true,
          totalSpent: true,
          lastOrder: true,
          notes: true,
          dette: true,
          address: true,
          city: true,
          departement: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      prisma.client
    )

    // Récupérer le total pour les statistiques (en parallèle)
    const [totalCount, activeCount] = await Promise.all([
      prisma.client.count({ where: whereClause }),
      prisma.client.count({ 
        where: { ...whereClause, statut: 'ACTIF' } 
      })
    ])

    // Formater les données pour le frontend
    const formattedClients = paginatedResult.data.map(client => ({
      id: client.id,
      name: client.nom,
      type: client.type,
      contact: client.contact || "",
      email: client.email || "",
      phone: client.telephone || "",
      address: client.address || "",
      city: client.city || "",
      departement: client.departement || "",
      status: client.statut === 'ACTIF' ? 'Actif' : client.statut === 'EN_ATTENTE' ? 'En attente' : 'Inactif',
      totalOrders: client.totalOrders,
      totalSpent: client.totalSpent,
      lastOrder: client.lastOrder?.toISOString().split('T')[0] || null,
      notes: client.notes || "",
      dette: client.dette || 0,
      createdAt: client.createdAt.toISOString()
    }))

    // Calculer les statistiques (utiliser les données paginées pour les calculs partiels)
    const totalClients = totalCount
    const activeClients = activeCount
    const totalRevenue = formattedClients.reduce((sum, client) => sum + client.totalSpent, 0)
    const averageOrderValue = totalClients > 0 
      ? totalRevenue / totalClients
      : 0

    const response = {
      clients: formattedClients,
      summary: {
        total: totalClients,
        active: activeClients,
        pending: formattedClients.filter(c => c.status === "En attente").length,
        totalRevenue: Math.round(totalRevenue), // Calculé sur la page actuelle seulement
        averageOrderValue: Math.round(averageOrderValue), // Calculé sur la page actuelle seulement
        topClient: formattedClients.length > 0
          ? formattedClients.reduce((max, client) => 
              client.totalSpent > max.totalSpent ? client : max
            )
          : null
      },
      pagination: {
        nextCursor: paginatedResult.nextCursor,
        hasMore: paginatedResult.hasMore
      }
    }

    logger.debug("✅ Clients data prepared:", {
      totalClients,
      activeClients,
      totalRevenue: Math.round(totalRevenue)
    })

    return NextResponse.json(response)

  } catch (error) {
    logger.error("❌ Error fetching clients:", error)
    return NextResponse.json(
      { error: "Erreur lors du chargement des clients" },
      { status: 500 }
    )
  }
}

// POST /api/representant/clients - Créer un nouveau client
export async function POST(request: NextRequest) {
  try {
    logger.debug("🔍 Creating new client...")
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

    logger.debug("✅ Client created:", newClient.id)

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

  } catch (error: any) {
    logger.error("❌ Error creating client:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du client: " + error.message },
      { status: 500 }
    )
  }
}

