export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Fonction pour traduire les actions en français
function translateAction(action: string, details: any, metadata: any): string {
  const translations: { [key: string]: string } = {
    // Utilisateurs
    'USER_CREATE': 'Création d\'un compte utilisateur',
    'USER_CREATED': 'Compte utilisateur créé avec succès',
    'USER_UPDATE': 'Mise à jour d\'un compte utilisateur',
    'USER_DELETE': 'Suppression d\'un compte utilisateur',
    'USER_LOGIN': 'Connexion d\'un utilisateur',
    'USER_LOGOUT': 'Déconnexion d\'un utilisateur',
    
    // Œuvres
    'WORK_CREATED': 'Création d\'une nouvelle œuvre',
    'WORK_CREATE': 'Création d\'une nouvelle œuvre',
    'WORK_UPDATED': 'Mise à jour d\'une œuvre',
    'WORK_DELETED': 'Suppression d\'une œuvre',
    'WORK_PUBLISHED': 'Publication d\'une œuvre',
    'WORK_VALIDATED': 'Validation d\'une œuvre',
    'WORK_REJECTED': 'Rejet d\'une œuvre',
    
    // Commandes
    'ORDER_CREATED': 'Création d\'une commande',
    'ORDER_UPDATED': 'Mise à jour d\'une commande',
    'ORDER_DELETED': 'Suppression d\'une commande',
    'ORDER_VALIDATED': 'Validation d\'une commande',
    'ORDER_CANCELLED': 'Annulation d\'une commande',
    'ORDER_DELIVERED': 'Livraison d\'une commande',
    
    // Stock
    'STOCK_UPDATE': 'Mise à jour du stock',
    'STOCK_MOVEMENT': 'Mouvement de stock',
    'STOCK_IN': 'Entrée de stock',
    'STOCK_OUT': 'Sortie de stock',
    
    // Disciplines
    'DISCIPLINE_CREATED': 'Création d\'une discipline',
    'DISCIPLINE_UPDATED': 'Mise à jour d\'une discipline',
    'DISCIPLINE_DELETED': 'Suppression d\'une discipline',
    
    // Système
    'SYSTEM_BACKUP': 'Sauvegarde du système',
    'SYSTEM_RESTORE': 'Restauration du système',
    'SYSTEM_CONFIG': 'Configuration du système',
  }

  const translated = translations[action] || action

  // Ajouter des détails si disponibles
  if (details) {
    if (details.userName) return `${translated} : ${details.userName}`
    if (details.workTitle) return `${translated} : ${details.workTitle}`
    if (details.orderRef) return `${translated} : ${details.orderRef}`
    if (details.name) return `${translated} : ${details.name}`
  }

  if (metadata) {
    if (metadata.userName) return `${translated} : ${metadata.userName}`
    if (metadata.workTitle) return `${translated} : ${metadata.workTitle}`
    if (metadata.name) return `${translated} : ${metadata.name}`
  }

  return translated
}

// Fonction pour obtenir une description détaillée
function getDetailedDescription(action: string, details: any, metadata: any): string {
  // Si les détails contiennent déjà un message clair
  if (details?.message) return details.message
  if (details?.description) return details.description

  // Créer une description basée sur l'action et les métadonnées
  const actionLower = action.toLowerCase()
  
  if (actionLower.includes('user') && actionLower.includes('create')) {
    const userName = details?.userName || metadata?.userName || metadata?.name || 'Utilisateur inconnu'
    const userEmail = details?.userEmail || metadata?.userEmail || metadata?.email || ''
    const userRole = details?.userRole || metadata?.userRole || metadata?.role || ''
    return `Un nouveau compte a été créé pour ${userName}${userEmail ? ` (${userEmail})` : ''}${userRole ? ` avec le rôle ${userRole}` : ''}`
  }

  if (actionLower.includes('work') && (actionLower.includes('create') || actionLower.includes('deleted'))) {
    const workTitle = details?.workTitle || metadata?.workTitle || metadata?.title || 'Œuvre inconnue'
    const workIsbn = details?.workIsbn || metadata?.workIsbn || metadata?.isbn || ''
    if (actionLower.includes('deleted')) {
      return `L'œuvre "${workTitle}"${workIsbn ? ` (ISBN: ${workIsbn})` : ''} a été supprimée`
    }
    return `L'œuvre "${workTitle}"${workIsbn ? ` (ISBN: ${workIsbn})` : ''} a été créée`
  }

  if (actionLower.includes('order')) {
    const orderRef = details?.orderRef || metadata?.orderRef || metadata?.reference || ''
    const amount = details?.amount || metadata?.amount || ''
    if (actionLower.includes('create')) {
      return `Nouvelle commande ${orderRef}${amount ? ` d'un montant de ${amount} FCFA` : ''}`
    }
    if (actionLower.includes('validated')) {
      return `La commande ${orderRef} a été validée`
    }
    if (actionLower.includes('cancelled')) {
      return `La commande ${orderRef} a été annulée`
    }
  }

  return translateAction(action, details, metadata)
}

// GET /api/pdg/audit-logs - Récupérer les logs d'audit
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "PDG") {
      return NextResponse.json({ error: "Forbidden - PDG role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const level = searchParams.get('level')

    // Récupérer les logs d'audit
    const whereClause: any = {}
    if (category && category !== 'all') {
      whereClause.action = { contains: category }
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const formattedLogs = auditLogs.map(log => {
      let parsedDetails: any = {}
      let parsedMetadata: any = {}
      
      try {
        if (log.details) {
          parsedDetails = JSON.parse(log.details)
        }
      } catch (e) {
        console.error("Error parsing log details:", e)
      }

      try {
        if (log.metadata) {
          parsedMetadata = JSON.parse(log.metadata)
        }
      } catch (e) {
        console.error("Error parsing log metadata:", e)
      }

      // Déterminer la catégorie à partir de l'action
      let logCategory: 'user' | 'order' | 'work' | 'discipline' | 'system' | 'financial' = 'system'
      const actionLower = log.action.toLowerCase()
      if (actionLower.includes('user')) {
        logCategory = 'user'
      } else if (actionLower.includes('order')) {
        logCategory = 'order'
      } else if (actionLower.includes('work')) {
        logCategory = 'work'
      } else if (actionLower.includes('discipline')) {
        logCategory = 'discipline'
      } else if (actionLower.includes('payment') || actionLower.includes('finance')) {
        logCategory = 'financial'
      }

      // Déterminer le niveau à partir de l'action
      let logLevel: 'info' | 'success' | 'warning' | 'error' = 'info'
      if (actionLower.includes('created') || actionLower.includes('validated') || actionLower.includes('approved')) {
        logLevel = 'success'
      } else if (actionLower.includes('deleted') || actionLower.includes('rejected')) {
        logLevel = 'warning'
      } else if (actionLower.includes('error') || actionLower.includes('failed')) {
        logLevel = 'error'
      }

      const description = getDetailedDescription(log.action, parsedDetails, parsedMetadata)
      
      return {
        id: log.id,
        action: log.action,
        description: description,
        details: parsedDetails,
        metadata: parsedMetadata,
        user: {
          id: log.userId || '',
          name: log.performedBy || 'Système',
          role: parsedDetails.performedByRole || parsedMetadata.role || 'PDG'
        },
        target: parsedDetails.target || parsedMetadata.target || undefined,
        timestamp: log.createdAt.toISOString(),
        level: logLevel,
        category: logCategory,
        categoryLabel: logCategory === 'user' ? 'Utilisateurs' :
                       logCategory === 'order' ? 'Commandes' :
                       logCategory === 'work' ? 'Œuvres' :
                       logCategory === 'discipline' ? 'Disciplines' :
                       logCategory === 'financial' ? 'Financier' : 'Système'
      }
    })

    // Filtrer par level si spécifié
    let filteredLogs = formattedLogs
    if (level && level !== 'all') {
      filteredLogs = formattedLogs.filter(log => log.level === level)
    }

    return NextResponse.json(filteredLogs)

  } catch (error: any) {
    console.error("Error fetching audit logs:", error)
    console.error("Stack trace:", error.stack)
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des logs d'audit",
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}


