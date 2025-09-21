import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/get-current-user"
import { prisma } from "@/lib/prisma"
import { Role, WorkStatus, OrderStatus } from "@prisma/client"

// GET - Récupérer les œuvres validées du concepteur
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (user.role !== "CONCEPTEUR") {
      return NextResponse.json({ error: "Forbidden - Concepteur role required" }, { status: 403 })
    }

    console.log("🎨 Fetching concepteur validated works for:", user.name)

    const userId = user.id

    try {
      // Vérifier si les tables existent en essayant une requête simple
      await prisma.$queryRaw`SELECT 1 FROM Work LIMIT 1`
      
      // Récupérer uniquement les œuvres validées du concepteur
      const works = await prisma.work.findMany({
        where: { 
          concepteurId: userId,
          status: {
            in: ["PUBLISHED", "ON_SALE", "OUT_OF_STOCK", "DISCONTINUED"]
          }
        },
        include: {
          discipline: true,
          author: {
            select: { 
              id: true, 
              name: true, 
              email: true 
            }
          },
          project: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          orderItems: {
            include: {
              order: {
                select: {
                  id: true,
                  status: true,
                  createdAt: true,
                  userId: true
                }
              }
            }
          }
        },
        orderBy: { publishedAt: "desc" }
      })

      console.log("🎨 Found works:", works.length)

      // Enrichir les données avec les statistiques de vente
      const enrichedWorks = works.map(work => {
        const sales = work.orderItems.reduce((sum, item) => {
          return sum + (item.order.status !== OrderStatus.CANCELLED ? item.quantity : 0)
        }, 0)
        
        const revenue = work.orderItems.reduce((sum, item) => {
          return sum + (item.order.status !== OrderStatus.CANCELLED ? (item.price * item.quantity) : 0)
        }, 0)
        
        const lastSale = work.orderItems
          .filter(item => item.order.status !== OrderStatus.CANCELLED)
          .sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime())[0]?.order?.createdAt || null

        return {
          id: work.id,
          title: work.title,
          isbn: work.isbn,
          price: work.price,
          status: work.status,
          discipline: work.discipline.name,
          author: work.author,
          sales,
          revenue,
          lastSale,
          createdAt: work.createdAt,
          updatedAt: work.updatedAt
        }
      })

      // Calculer les statistiques globales
      const stats = {
        total: enrichedWorks.length,
        published: enrichedWorks.filter(w => w.status === WorkStatus.ON_SALE).length,
        submitted: enrichedWorks.filter(w => w.status === WorkStatus.SUBMITTED).length,
        draft: enrichedWorks.filter(w => w.status === WorkStatus.DRAFT).length,
        totalSales: enrichedWorks.reduce((sum, w) => sum + w.sales, 0),
        totalRevenue: enrichedWorks.reduce((sum, w) => sum + w.revenue, 0)
      }

      console.log(`🎨 Concepteur works data: ${stats.total} works, ${stats.totalSales} sales, ${stats.totalRevenue} revenue`)

      return NextResponse.json({
        works: enrichedWorks,
        stats,
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      })

    } catch (dbError) {
      console.log("⚠️ Database not ready, returning empty data:", dbError.message)
      
      // Retourner des données vides si la base de données n'est pas prête
      return NextResponse.json({
        works: [],
        stats: {
          total: 0,
          published: 0,
          submitted: 0,
          draft: 0,
          totalSales: 0,
          totalRevenue: 0
        },
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        },
        message: "Base de données en cours de configuration. Veuillez exécuter le script de configuration."
      })
    }

  } catch (error) {
    console.error("❌ Error fetching concepteur works:", error)
    return NextResponse.json({ 
      error: "Internal Server Error",
      message: "Erreur lors de la récupération des œuvres. Veuillez vérifier la configuration de la base de données."
    }, { status: 500 })
  }
}

// POST - Non autorisé pour les concepteurs (les œuvres sont créées par le PDG)
export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: "Forbidden - Concepteurs cannot create works directly. Submit a project for validation instead."
  }, { status: 403 })
}

// PUT - Non autorisé pour les concepteurs (les œuvres sont gérées par le PDG)
export async function PUT(request: NextRequest) {
  return NextResponse.json({
    error: "Forbidden - Concepteurs cannot modify works directly. Contact PDG for changes."
  }, { status: 403 })
}
