import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/stock/integrations - Récupérer les intégrations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut accéder aux intégrations
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'list', 'status', 'sync'

    switch (type) {
      case 'list':
        // Récupérer la liste des intégrations
        const integrations = await prisma.stockIntegration.findMany({
          include: {
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        return NextResponse.json(integrations)

      case 'status':
        // Récupérer le statut des intégrations
        const statusData = await prisma.stockIntegration.findMany({
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
            syncStatus: true,
            lastSync: true,
            errorCount: true,
            lastError: true
          },
          orderBy: {
            lastSync: 'desc'
          }
        })

        return NextResponse.json(statusData)

      case 'sync':
        // Déclencher une synchronisation
        const { integrationId } = Object.fromEntries(searchParams)
        
        if (!integrationId) {
          return NextResponse.json(
            { error: "ID de l'intégration requis" },
            { status: 400 }
          )
        }

        const integration = await prisma.stockIntegration.findUnique({
          where: { id: integrationId }
        })

        if (!integration) {
          return NextResponse.json(
            { error: "Intégration non trouvée" },
            { status: 404 }
          )
        }

        if (!integration.isActive) {
          return NextResponse.json(
            { error: "Intégration désactivée" },
            { status: 400 }
          )
        }

        // Mettre à jour le statut de synchronisation
        await prisma.stockIntegration.update({
          where: { id: integrationId },
          data: {
            syncStatus: 'SYNCING',
            lastSync: new Date()
          }
        })

        // Simuler une synchronisation (dans un vrai système, appeler l'API externe)
        try {
          await simulateSync(integration)
          
          // Succès
          await prisma.stockIntegration.update({
            where: { id: integrationId },
            data: {
              syncStatus: 'SUCCESS',
              errorCount: 0,
              lastError: null
            }
          })

          return NextResponse.json({ 
            message: "Synchronisation réussie",
            status: 'SUCCESS'
          })

        } catch (error) {
          // Échec
          await prisma.stockIntegration.update({
            where: { id: integrationId },
            data: {
              syncStatus: 'FAILED',
              errorCount: integration.errorCount + 1,
              lastError: error instanceof Error ? error.message : 'Erreur inconnue'
            }
          })

          return NextResponse.json(
            { error: "Erreur lors de la synchronisation" },
            { status: 500 }
          )
        }

      default:
        return NextResponse.json({ error: "Type non valide" }, { status: 400 })
    }

  } catch (error) {
    logger.error("Erreur lors de la gestion des intégrations:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST /api/stock/integrations - Créer une intégration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut créer des intégrations
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, config } = body

    if (!name || !type || !config) {
      return NextResponse.json(
        { error: "Nom, type et configuration sont requis" },
        { status: 400 }
      )
    }

    // Valider la configuration selon le type
    const validationResult = validateIntegrationConfig(type, config)
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    const newIntegration = await prisma.stockIntegration.create({
      data: {
        name,
        type,
        config: JSON.stringify(config),
        createdBy: session.user.id
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(newIntegration, { status: 201 })

  } catch (error) {
    logger.error("Erreur lors de la création de l'intégration:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT /api/stock/integrations - Mettre à jour une intégration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut modifier les intégrations
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { integrationId, name, type, config, isActive } = body

    if (!integrationId) {
      return NextResponse.json(
        { error: "ID de l'intégration requis" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (config !== undefined) {
      // Valider la configuration
      const validationResult = validateIntegrationConfig(type, config)
      if (!validationResult.valid) {
        return NextResponse.json(
          { error: validationResult.error },
          { status: 400 }
        )
      }
      updateData.config = JSON.stringify(config)
    }
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedIntegration = await prisma.stockIntegration.update({
      where: { id: integrationId },
      data: updateData,
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedIntegration)

  } catch (error) {
    logger.error("Erreur lors de la mise à jour de l'intégration:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE /api/stock/integrations - Supprimer une intégration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut supprimer les intégrations
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const integrationId = searchParams.get('integrationId')

    if (!integrationId) {
      return NextResponse.json(
        { error: "ID de l'intégration requis" },
        { status: 400 }
      )
    }

    // Vérifier que l'intégration existe
    const integration = await prisma.stockIntegration.findUnique({
      where: { id: integrationId }
    })

    if (!integration) {
      return NextResponse.json(
        { error: "Intégration non trouvée" },
        { status: 404 }
      )
    }

    // Supprimer l'intégration
    await prisma.stockIntegration.delete({
      where: { id: integrationId }
    })

    return NextResponse.json({ message: "Intégration supprimée avec succès" })

  } catch (error) {
    logger.error("Erreur lors de la suppression de l'intégration:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// Fonction pour valider la configuration d'intégration
function validateIntegrationConfig(type: string, config: any): { valid: boolean; error?: string } {
  switch (type) {
    case 'ORDER_SYSTEM':
      if (!config.apiUrl || !config.apiKey) {
        return { valid: false, error: "URL de l'API et clé API requis" }
      }
      break
    case 'ACCOUNTING_SYSTEM':
      if (!config.connectionString || !config.database) {
        return { valid: false, error: "Chaîne de connexion et base de données requis" }
      }
      break
    case 'WAREHOUSE_SYSTEM':
      if (!config.endpoint || !config.credentials) {
        return { valid: false, error: "Endpoint et identifiants requis" }
      }
      break
    case 'ECOMMERCE_PLATFORM':
      if (!config.platform || !config.apiToken) {
        return { valid: false, error: "Plateforme et token API requis" }
      }
      break
    default:
      return { valid: false, error: "Type d'intégration non supporté" }
  }
  
  return { valid: true }
}

// Fonction pour simuler une synchronisation
async function simulateSync(integration: any): Promise<void> {
  // Simuler un délai de synchronisation
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Simuler une erreur aléatoire (10% de chance)
  if (Math.random() < 0.1) {
    throw new Error("Erreur de connexion avec le système externe")
  }
  
  // Dans un vrai système, ici on ferait :
  // 1. Appel à l'API externe
  // 2. Synchronisation des données
  // 3. Mise à jour des stocks
  // 4. Création d'alertes si nécessaire
}
