import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/pdg/stock/works - Liste des œuvres pour la gestion du stock
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const discipline = searchParams.get('discipline') || ''
    const status = searchParams.get('status') || ''
    const lowStock = searchParams.get('lowStock') === 'true'

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { internalCode: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (discipline && discipline !== 'all') {
      whereClause.discipline = {
        name: { contains: discipline, mode: 'insensitive' }
      }
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (lowStock) {
      whereClause.stock = {
        lte: prisma.work.fields.minStock
      }
    }

    const works = await prisma.work.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculer les statistiques de stock
    const stockStats = await prisma.work.aggregate({
      where: whereClause,
      _sum: {
        stock: true
      },
      _avg: {
        stock: true
      },
      _count: {
        id: true
      }
    })

    const lowStockCount = await prisma.work.count({
      where: {
        ...whereClause,
        stock: {
          lte: prisma.work.fields.minStock
        }
      }
    })

    const worksData = works.map(work => ({
      id: work.id,
      title: work.title,
      isbn: work.isbn,
      internalCode: work.internalCode,
      price: work.price,
      tva: work.tva,
      discountRate: work.discountRate,
      stock: work.stock,
      physicalStock: work.physicalStock,
      minStock: work.minStock,
      maxStock: work.maxStock,
      discipline: work.discipline?.name || 'Non définie',
      author: work.author?.name || 'Auteur inconnu',
      project: work.project?.title || null,
      status: work.status,
      publishedAt: work.publishedAt?.toISOString(),
      createdAt: work.createdAt.toISOString(),
      updatedAt: work.updatedAt.toISOString(),
      isLowStock: work.stock <= work.minStock
    }))

    return NextResponse.json({
      works: worksData,
      stats: {
        total: stockStats._count.id,
        totalStock: stockStats._sum.stock || 0,
        averageStock: Math.round(stockStats._avg.stock || 0),
        lowStockCount
      }
    })

  } catch (error: any) {
    console.error('Erreur lors de la récupération des œuvres:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/pdg/stock/works - Créer ou modifier une œuvre
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id, // Si fourni, c'est une mise à jour
      title, 
      isbn, 
      internalCode,
      price, 
      tva, 
      discountRate,
      stock, 
      minStock, 
      maxStock,
      disciplineId,
      authorId,
      description,
      category,
      targetAudience,
      educationalObjectives,
      contentType,
      keywords
    } = body

    if (!title || !isbn || !disciplineId) {
      return NextResponse.json({ 
        error: 'Titre, ISBN et discipline sont requis' 
      }, { status: 400 })
    }

    // Vérifier que l'ISBN est unique (sauf pour la mise à jour)
    if (!id) {
      const existingWork = await prisma.work.findUnique({
        where: { isbn }
      })
      if (existingWork) {
        return NextResponse.json({ 
          error: 'Un œuvre avec cet ISBN existe déjà' 
        }, { status: 400 })
      }
    }

    const workData = {
      title,
      isbn,
      internalCode: internalCode || null,
      price: price || 0,
      tva: tva || 0.18,
      discountRate: discountRate || null,
      stock: stock || 0,
      physicalStock: stock || 0,
      minStock: minStock || 10,
      maxStock: maxStock || null,
      disciplineId,
      authorId: authorId || null,
      description: description || null,
      category: category || null,
      targetAudience: targetAudience || null,
      educationalObjectives: educationalObjectives || null,
      contentType: contentType || null,
      keywords: keywords || null,
      status: 'PUBLISHED' // Créé directement comme publié par le PDG
    }

    let work
    if (id) {
      // Mise à jour
      work = await prisma.work.update({
        where: { id },
        data: workData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          discipline: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    } else {
      // Création
      work = await prisma.work.create({
        data: workData,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          discipline: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Créer un mouvement de stock initial si stock > 0
      if (work.stock > 0) {
        await prisma.stockMovement.create({
          data: {
            workId: work.id,
            type: 'INBOUND',
            quantity: work.stock,
            reason: 'Stock initial',
            reference: `INITIAL_${work.id}`,
            performedBy: session.user.id,
            source: 'Création PDG',
            unitPrice: work.price,
            totalAmount: work.price * work.stock
          }
        })
      }
    }

    // Créer une alerte automatique si le stock est à 0
    if (work.stock === 0) {
      // Vérifier s'il n'y a pas déjà une alerte non résolue pour ce livre
      const existingAlert = await prisma.stockAlert.findFirst({
        where: {
          workId: work.id,
          type: 'STOCK_OUT',
          isResolved: false
        }
      })

      if (!existingAlert) {
        await prisma.stockAlert.create({
          data: {
            workId: work.id,
            type: 'STOCK_OUT',
            severity: 'ERROR',
            title: `Stock épuisé - ${work.title}`,
            message: `Le stock est épuisé pour "${work.title}" (ISBN: ${work.isbn})`
          }
        })
      }
    } else {
      // Résoudre les alertes de stock épuisé si le stock est maintenant > 0
      await prisma.stockAlert.updateMany({
        where: {
          workId: work.id,
          type: 'STOCK_OUT',
          isResolved: false
        },
        data: {
          isResolved: true,
          resolvedBy: session.user.id,
          resolvedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      work: {
        id: work.id,
        title: work.title,
        isbn: work.isbn,
        internalCode: work.internalCode,
        price: work.price,
        tva: work.tva,
        discountRate: work.discountRate,
        stock: work.stock,
        physicalStock: work.physicalStock,
        minStock: work.minStock,
        maxStock: work.maxStock,
        discipline: work.discipline?.name,
        author: work.author?.name,
        status: work.status,
        createdAt: work.createdAt.toISOString(),
        updatedAt: work.updatedAt.toISOString()
      }
    }, { status: id ? 200 : 201 })

  } catch (error: any) {
    console.error('Erreur lors de la création/modification de l\'œuvre:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

