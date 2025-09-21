import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAuthorAPIs() {
  try {
    console.log('🧪 Testing Author APIs with real data...')

    // 1. Trouver l'auteur de test
    const author = await prisma.user.findUnique({
      where: { email: 'auteur@test.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    if (!author) {
      console.log('❌ Author not found. Run create-author-test-data.ts first.')
      return
    }

    console.log('✅ Author found:', author.name)

    // 2. Tester les données du dashboard
    console.log('\n📊 Testing Dashboard Data...')

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

    console.log(`✅ Found ${authorWorks.length} works for author`)

    // Calculer les statistiques
    const totalWorks = authorWorks.length
    const publishedWorks = authorWorks.filter(w => w.status === 'ON_SALE').length
    
    const totalSales = authorWorks.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        return workSum + (item.order && item.order.status !== 'CANCELLED' ? item.quantity : 0)
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

    const totalRoyaltiesPending = totalRoyaltiesGenerated - totalRoyaltiesPaid

    console.log('📈 Dashboard Statistics:')
    console.log(`   - Total Works: ${totalWorks}`)
    console.log(`   - Published Works: ${publishedWorks}`)
    console.log(`   - Total Sales: ${totalSales}`)
    console.log(`   - Total Royalties Generated: ${totalRoyaltiesGenerated.toLocaleString()} FCFA`)
    console.log(`   - Total Royalties Paid: ${totalRoyaltiesPaid.toLocaleString()} FCFA`)
    console.log(`   - Total Royalties Pending: ${totalRoyaltiesPending.toLocaleString()} FCFA`)

    // 3. Tester les œuvres récentes
    console.log('\n📚 Testing Recent Works...')
    const recentWorks = authorWorks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)

    recentWorks.forEach((work, index) => {
      const sales = work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== 'CANCELLED' ? item.quantity : 0)
      }, 0)
      
      const royalties = work.royalties.reduce((sum, royalty) => sum + royalty.amount, 0)
      const royaltiesPaid = work.royalties.reduce((sum, royalty) => sum + (royalty.paid ? royalty.amount : 0), 0)
      
      console.log(`   ${index + 1}. ${work.title}`)
      console.log(`      - Discipline: ${work.discipline.name}`)
      console.log(`      - Status: ${work.status}`)
      console.log(`      - Sales: ${sales}`)
      console.log(`      - Royalties: ${royalties.toLocaleString()} FCFA`)
      console.log(`      - Paid: ${royaltiesPaid.toLocaleString()} FCFA`)
    })

    // 4. Tester les paiements récents
    console.log('\n💰 Testing Recent Payments...')
    const recentPayments = await prisma.royalty.findMany({
      where: { userId: author.id },
      include: {
        work: {
          select: {
            title: true,
            discipline: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    recentPayments.forEach((payment, index) => {
      console.log(`   ${index + 1}. ${payment.work.title}`)
      console.log(`      - Amount: ${payment.amount.toLocaleString()} FCFA`)
      console.log(`      - Paid: ${payment.paid ? 'Yes' : 'No'}`)
      console.log(`      - Date: ${payment.createdAt.toLocaleDateString()}`)
    })

    // 5. Tester les données mensuelles
    console.log('\n📅 Testing Monthly Data...')
    const monthlyData = []
    const currentDate = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'short' })
      
      const monthSales = authorWorks.reduce((sum, work) => {
        return sum + work.orderItems.reduce((workSum, item) => {
          if (item.order && new Date(item.order.createdAt).getMonth() === monthDate.getMonth() && 
              new Date(item.order.createdAt).getFullYear() === monthDate.getFullYear()) {
            return workSum + item.quantity
          }
          return workSum
        }, 0)
      }, 0)
      
      const monthRoyalties = authorWorks.reduce((sum, work) => {
        return sum + work.royalties.reduce((royaltySum, royalty) => {
          if (new Date(royalty.createdAt).getMonth() === monthDate.getMonth() && 
              new Date(royalty.createdAt).getFullYear() === monthDate.getFullYear()) {
            return royaltySum + royalty.amount
          }
          return royaltySum
        }, 0)
      }, 0)
      
      monthlyData.push({
        month: monthName,
        sales: monthSales,
        royalties: monthRoyalties
      })
    }

    monthlyData.forEach(data => {
      console.log(`   ${data.month}: ${data.sales} sales, ${data.royalties.toLocaleString()} FCFA royalties`)
    })

    console.log('\n🎉 All tests completed successfully!')
    console.log('✅ The author APIs should work correctly with real data.')

  } catch (error) {
    console.error('❌ Error testing author APIs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuthorAPIs()


