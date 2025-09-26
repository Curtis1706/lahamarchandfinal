import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/stock/alerts - Récupérer les alertes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut accéder aux alertes
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'rules', 'alerts', 'unread'
    const severity = searchParams.get('severity')
    const isResolved = searchParams.get('isResolved')
    const limit = parseInt(searchParams.get('limit') || '50')

    switch (type) {
      case 'rules':
        // Récupérer les règles d'alerte
        const rules = await prisma.stockAlertRule.findMany({
          include: {
            createdByUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            _count: {
              select: {
                triggeredAlerts: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        return NextResponse.json(rules)

      case 'alerts':
        // Récupérer les alertes
        const whereClause: any = {}
        
        if (severity) {
          whereClause.severity = severity
        }
        
        if (isResolved !== null) {
          whereClause.isResolved = isResolved === 'true'
        }

        const alerts = await prisma.stockAlert.findMany({
          where: whereClause,
          include: {
            rule: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                stock: true,
                minStock: true
              }
            },
            resolvedByUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit
        })

        return NextResponse.json(alerts)

      case 'unread':
        // Récupérer les alertes non lues
        const unreadAlerts = await prisma.stockAlert.findMany({
          where: {
            isRead: false,
            isResolved: false
          },
          include: {
            rule: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            work: {
              select: {
                id: true,
                title: true,
                isbn: true,
                stock: true,
                minStock: true
              }
            }
          },
          orderBy: [
            { severity: 'desc' },
            { createdAt: 'desc' }
          ],
          take: limit
        })

        return NextResponse.json(unreadAlerts)

      default:
        return NextResponse.json({ error: "Type non valide" }, { status: 400 })
    }

  } catch (error) {
    console.error("Erreur lors de la récupération des alertes:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST /api/stock/alerts - Créer une règle d'alerte ou marquer une alerte comme lue
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut créer des règles d'alerte
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'create_rule':
        // Créer une nouvelle règle d'alerte
        const { name, description, type, conditions, actions, priority } = data

        if (!name || !type || !conditions || !actions) {
          return NextResponse.json(
            { error: "Nom, type, conditions et actions sont requis" },
            { status: 400 }
          )
        }

        const newRule = await prisma.stockAlertRule.create({
          data: {
            name,
            description,
            type,
            conditions: JSON.stringify(conditions),
            actions: JSON.stringify(actions),
            priority: priority || 'MEDIUM',
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

        return NextResponse.json(newRule, { status: 201 })

      case 'mark_read':
        // Marquer une alerte comme lue
        const { alertId } = data

        if (!alertId) {
          return NextResponse.json(
            { error: "ID de l'alerte requis" },
            { status: 400 }
          )
        }

        const updatedAlert = await prisma.stockAlert.update({
          where: { id: alertId },
          data: { isRead: true }
        })

        return NextResponse.json(updatedAlert)

      case 'resolve':
        // Résoudre une alerte
        const { alertId: resolveAlertId, resolution } = data

        if (!resolveAlertId) {
          return NextResponse.json(
            { error: "ID de l'alerte requis" },
            { status: 400 }
          )
        }

        const resolvedAlert = await prisma.stockAlert.update({
          where: { id: resolveAlertId },
          data: {
            isResolved: true,
            resolvedBy: session.user.id,
            resolvedAt: new Date()
          }
        })

        return NextResponse.json(resolvedAlert)

      default:
        return NextResponse.json({ error: "Action non valide" }, { status: 400 })
    }

  } catch (error) {
    console.error("Erreur lors de la création/gestion des alertes:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT /api/stock/alerts - Mettre à jour une règle d'alerte
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut modifier les règles d'alerte
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { ruleId, name, description, type, conditions, actions, priority, isActive } = body

    if (!ruleId) {
      return NextResponse.json(
        { error: "ID de la règle requis" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (conditions !== undefined) updateData.conditions = JSON.stringify(conditions)
    if (actions !== undefined) updateData.actions = JSON.stringify(actions)
    if (priority !== undefined) updateData.priority = priority
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedRule = await prisma.stockAlertRule.update({
      where: { id: ruleId },
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

    return NextResponse.json(updatedRule)

  } catch (error) {
    console.error("Erreur lors de la mise à jour de la règle:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE /api/stock/alerts - Supprimer une règle d'alerte
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut supprimer les règles d'alerte
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('ruleId')

    if (!ruleId) {
      return NextResponse.json(
        { error: "ID de la règle requis" },
        { status: 400 }
      )
    }

    // Vérifier que la règle existe
    const rule = await prisma.stockAlertRule.findUnique({
      where: { id: ruleId }
    })

    if (!rule) {
      return NextResponse.json({ error: "Règle non trouvée" }, { status: 404 })
    }

    // Supprimer la règle (les alertes associées restent pour l'historique)
    await prisma.stockAlertRule.delete({
      where: { id: ruleId }
    })

    return NextResponse.json({ message: "Règle supprimée avec succès" })

  } catch (error) {
    console.error("Erreur lors de la suppression de la règle:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
