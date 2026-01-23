import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/stock/export - Exporter les données de stock
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut exporter les données
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'inventory' // 'inventory', 'movements', 'alerts'
    const format = searchParams.get('format') || 'csv' // 'csv', 'excel', 'json'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let data: any[] = []
    let filename = ''

    switch (type) {
      case 'inventory':
        // Exporter l'inventaire
        const works = await prisma.work.findMany({
          where: {
            status: 'PUBLISHED',
            ...(startDate || endDate ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {})
              }
            } : {})
          },
          select: {
            id: true,
            title: true,
            isbn: true,
            price: true,
            stock: true,
            minStock: true,
            maxStock: true,
            status: true,
            createdAt: true,
            discipline: {
              select: {
                name: true
              }
            },
            author: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            title: 'asc'
          }
        })

        data = works.map(work => ({
          'ID': work.id,
          'Titre': work.title,
          'ISBN': work.isbn,
          'Prix': work.price,
          'Stock': work.stock,
          'Stock minimum': work.minStock,
          'Stock maximum': work.maxStock || '',
          'Statut': work.status,
          'Discipline': work.discipline.name,
          'Auteur': work.author?.name || '',
          'Email auteur': work.author?.email || '',
          'Date création': work.createdAt.toISOString().split('T')[0]
        }))
        filename = `inventaire_${new Date().toISOString().split('T')[0]}.${format}`
        break

      case 'movements':
        // Exporter les mouvements de stock
        const movements = await prisma.stockMovement.findMany({
          where: {
            ...(startDate || endDate ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {})
              }
            } : {})
          },
          include: {
            work: {
              select: {
                title: true,
                isbn: true
              }
            },
            performedByUser: {
              select: {
                name: true,
                email: true
              }
            },
            partner: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10000 // Limiter à 10000 mouvements
        })

        data = movements.map(movement => ({
          'ID': movement.id,
          'Date': movement.createdAt.toISOString().split('T')[0],
          'Heure': movement.createdAt.toISOString().split('T')[1].split('.')[0],
          'Livre': movement.work.title,
          'ISBN': movement.work.isbn,
          'Type': movement.type,
          'Quantité': movement.quantity,
          'Raison': movement.reason || '',
          'Référence': movement.reference || '',
          'Effectué par': movement.performedByUser?.name || '',
          'Partenaire': movement.partner?.name || '',
          'Source': movement.source || '',
          'Destination': movement.destination || '',
          'Prix unitaire': movement.unitPrice || '',
          'Montant total': movement.totalAmount || ''
        }))
        filename = `mouvements_stock_${new Date().toISOString().split('T')[0]}.${format}`
        break

      case 'alerts':
        // Exporter les alertes
        const alerts = await prisma.stockAlert.findMany({
          where: {
            ...(startDate || endDate ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {})
              }
            } : {})
          },
          include: {
            work: {
              select: {
                title: true,
                isbn: true,
                stock: true,
                minStock: true
              }
            },
            rule: {
              select: {
                name: true,
                type: true
              }
            },
            resolvedByUser: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1000
        })

        data = alerts.map(alert => ({
          'ID': alert.id,
          'Date': alert.createdAt.toISOString().split('T')[0],
          'Titre': alert.title,
          'Message': alert.message,
          'Type': alert.type,
          'Sévérité': alert.severity,
          'Livre': alert.work?.title || '',
          'ISBN': alert.work?.isbn || '',
          'Stock actuel': alert.work?.stock || '',
          'Stock minimum': alert.work?.minStock || '',
          'Règle': alert.rule?.name || '',
          'Type de règle': alert.rule?.type || '',
          'Lu': alert.isRead ? 'Oui' : 'Non',
          'Résolu': alert.isResolved ? 'Oui' : 'Non',
          'Résolu par': alert.resolvedByUser?.name || '',
          'Date résolution': alert.resolvedAt ? alert.resolvedAt.toISOString().split('T')[0] : ''
        }))
        filename = `alertes_stock_${new Date().toISOString().split('T')[0]}.${format}`
        break

      default:
        return NextResponse.json({ error: "Type d'export non valide" }, { status: 400 })
    }

    // Générer le fichier selon le format
    if (format === 'json') {
      return NextResponse.json(data, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    } else if (format === 'csv' || format === 'excel') {
      // Convertir en CSV
      if (data.length === 0) {
        return NextResponse.json({ error: "Aucune donnée à exporter" }, { status: 400 })
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            // Échapper les virgules et guillemets dans les valeurs
            if (value === null || value === undefined) return ''
            const stringValue = String(value)
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          }).join(',')
        )
      ]

      const csvContent = csvRows.join('\n')
      const csvBuffer = Buffer.from(csvContent, 'utf-8')

      return new NextResponse(csvBuffer, {
        headers: {
          'Content-Type': format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': csvBuffer.length.toString()
        }
      })
    } else {
      return NextResponse.json({ error: "Format non supporté" }, { status: 400 })
    }

  } catch (error) {
    logger.error("Erreur lors de l'export:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

