import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function testAuthorAPI() {
  try {
    console.log("🧪 Testing author API...")

    // Trouver l'auteur
    const author = await prisma.user.findUnique({
      where: { email: "auteur@lahamarchand.com" }
    })

    if (!author) {
      console.log("❌ Author not found")
      return
    }

    console.log("✅ Found author:", author.name)

    // Récupérer les œuvres de l'auteur
    const authorWorks = await prisma.work.findMany({
      where: { authorId: author.id },
      include: {
        discipline: true,
        orderItems: {
          include: {
            order: true
          }
        },
        royalties: {
          where: { userId: author.id }
        }
      }
    })

    console.log("📚 Found works:", authorWorks.length)

    // Calculer les statistiques
    const totalWorks = authorWorks.length
    const publishedWorks = authorWorks.filter(w => w.status === "ON_SALE").length
    
    const totalSales = authorWorks.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        return workSum + (item.order && item.order.status !== "CANCELLED" ? item.quantity : 0)
      }, 0)
    }, 0)

    const totalRoyaltiesGenerated = authorWorks.reduce((sum, work) => {
      return sum + work.royalties.reduce((royaltySum, royalty) => {
        return royaltySum + royalty.amount
      }, 0)
    }, 0)

    const totalRoyaltiesPaid = authorWorks.reduce((sum, work) => {
      return sum + work.royalties.reduce((royaltySum, royalty) => {
        return royaltySum + (royalty.paid ? royalty.amount : 0)
      }, 0)
    }, 0)

    console.log("\n📊 Statistics:")
    console.log("Total works:", totalWorks)
    console.log("Published works:", publishedWorks)
    console.log("Total sales:", totalSales)
    console.log("Total royalties generated:", totalRoyaltiesGenerated)
    console.log("Total royalties paid:", totalRoyaltiesPaid)

    // Test des œuvres récentes
    const recentWorks = authorWorks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(work => {
        const sales = work.orderItems.reduce((sum, item) => {
          return sum + (item.order && item.order.status !== "CANCELLED" ? item.quantity : 0)
        }, 0)
        
        const royalties = work.royalties.reduce((sum, royalty) => sum + royalty.amount, 0)
        const royaltiesPaid = work.royalties.reduce((sum, royalty) => sum + (royalty.paid ? royalty.amount : 0), 0)
        
        return {
          id: work.id,
          title: work.title,
          discipline: work.discipline.name,
          status: work.status,
          sales,
          royaltiesGenerated: royalties,
          royaltiesPaid,
          royaltiesPending: royalties - royaltiesPaid
        }
      })

    console.log("\n📚 Recent works:")
    recentWorks.forEach(work => {
      console.log(`- ${work.title} (${work.discipline}): ${work.sales} sales, ${work.royaltiesGenerated} FCFA royalties`)
    })

    console.log("\n✅ API test completed successfully!")

  } catch (error) {
    console.error("❌ Error testing author API:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuthorAPI()



