import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyRoyaltiesCalculations() {
  try {
    console.log('🧮 Verifying Royalties Calculations...')

    // 1. Trouver l'auteur
    const author = await prisma.user.findUnique({
      where: { email: 'auteur@test.com' }
    })

    if (!author) {
      console.log('❌ Author not found')
      return
    }

    console.log('✅ Author:', author.name)

    // 2. Récupérer toutes les œuvres avec leurs ventes
    const works = await prisma.work.findMany({
      where: { authorId: author.id },
      include: {
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

    console.log(`\n📚 Verifying ${works.length} works...`)

    const royaltyRate = 0.15 // 15%
    let totalExpectedRoyalties = 0
    let totalActualRoyalties = 0

    for (const work of works) {
      console.log(`\n📖 ${work.title}`)
      console.log(`   Price: ${work.price.toLocaleString()} FCFA`)
      console.log(`   Status: ${work.status}`)

      // Calculer les ventes totales
      const totalSales = work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== 'CANCELLED' ? item.quantity : 0)
      }, 0)

      // Calculer le revenu total
      const totalRevenue = work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== 'CANCELLED' ? (item.price * item.quantity) : 0)
      }, 0)

      // Calculer les royalties attendues
      const expectedRoyalties = totalRevenue * royaltyRate

      // Calculer les royalties réelles
      const actualRoyalties = work.royalties.reduce((sum, royalty) => sum + royalty.amount, 0)
      const paidRoyalties = work.royalties.reduce((sum, royalty) => sum + (royalty.paid ? royalty.amount : 0), 0)
      const pendingRoyalties = actualRoyalties - paidRoyalties

      console.log(`   📊 Sales: ${totalSales} copies`)
      console.log(`   💰 Revenue: ${totalRevenue.toLocaleString()} FCFA`)
      console.log(`   🧮 Expected Royalties (15%): ${expectedRoyalties.toLocaleString()} FCFA`)
      console.log(`   ✅ Actual Royalties: ${actualRoyalties.toLocaleString()} FCFA`)
      console.log(`   💳 Paid: ${paidRoyalties.toLocaleString()} FCFA`)
      console.log(`   ⏳ Pending: ${pendingRoyalties.toLocaleString()} FCFA`)

      // Vérifier la cohérence
      const difference = Math.abs(expectedRoyalties - actualRoyalties)
      if (difference < 1) { // Tolérance de 1 FCFA pour les arrondis
        console.log(`   ✅ Calculation is correct!`)
      } else {
        console.log(`   ⚠️  Calculation difference: ${difference.toLocaleString()} FCFA`)
      }

      totalExpectedRoyalties += expectedRoyalties
      totalActualRoyalties += actualRoyalties
    }

    console.log(`\n📈 SUMMARY:`)
    console.log(`   Total Expected Royalties: ${totalExpectedRoyalties.toLocaleString()} FCFA`)
    console.log(`   Total Actual Royalties: ${totalActualRoyalties.toLocaleString()} FCFA`)
    
    const totalDifference = Math.abs(totalExpectedRoyalties - totalActualRoyalties)
    if (totalDifference < 1) {
      console.log(`   ✅ All calculations are correct!`)
    } else {
      console.log(`   ⚠️  Total difference: ${totalDifference.toLocaleString()} FCFA`)
    }

    // 3. Vérifier la répartition des paiements
    console.log(`\n💳 Payment Distribution:`)
    const allRoyalties = await prisma.royalty.findMany({
      where: { userId: author.id },
      include: {
        work: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const paidCount = allRoyalties.filter(r => r.paid).length
    const pendingCount = allRoyalties.filter(r => !r.paid).length
    const totalPaidAmount = allRoyalties.filter(r => r.paid).reduce((sum, r) => sum + r.amount, 0)
    const totalPendingAmount = allRoyalties.filter(r => !r.paid).reduce((sum, r) => sum + r.amount, 0)

    console.log(`   Paid Payments: ${paidCount} (${totalPaidAmount.toLocaleString()} FCFA)`)
    console.log(`   Pending Payments: ${pendingCount} (${totalPendingAmount.toLocaleString()} FCFA)`)

    console.log(`\n🎉 Royalties verification completed!`)

  } catch (error) {
    console.error('❌ Error verifying royalties:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyRoyaltiesCalculations()


