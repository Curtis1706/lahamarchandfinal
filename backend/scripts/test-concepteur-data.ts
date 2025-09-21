import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConcepteurData() {
  try {
    console.log('🧪 Testing Concepteur data...')

    // 1. Trouver le concepteur
    const concepteur = await prisma.user.findUnique({
      where: { email: 'concepteur@test.com' }
    })

    if (!concepteur) {
      console.log('❌ Concepteur not found')
      return
    }

    console.log('✅ Concepteur found:', concepteur.name)

    // 2. Trouver les œuvres du concepteur
    const works = await prisma.work.findMany({
      where: { concepteurId: concepteur.id },
      include: {
        discipline: true,
        author: { select: { name: true } },
        orderItems: { include: { order: true } }
      }
    })

    console.log(`✅ Found ${works.length} works for concepteur`)

    // 3. Calculer les statistiques
    const totalWorks = works.length
    const publishedWorks = works.filter(w => w.status === 'ON_SALE').length
    const submittedWorks = works.filter(w => w.status === 'SUBMITTED').length
    const draftWorks = works.filter(w => w.status === 'DRAFT').length

    const totalSales = works.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        return workSum + (item.order && item.order.status !== 'CANCELLED' ? item.quantity : 0)
      }, 0)
    }, 0)

    const totalRevenue = works.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        return workSum + (item.order && item.order.status !== 'CANCELLED' ? (item.price * item.quantity) : 0)
      }, 0)
    }, 0)

    console.log('📊 Concepteur Statistics:')
    console.log(`   - Total Works: ${totalWorks}`)
    console.log(`   - Published Works: ${publishedWorks}`)
    console.log(`   - Submitted Works: ${submittedWorks}`)
    console.log(`   - Draft Works: ${draftWorks}`)
    console.log(`   - Total Sales: ${totalSales}`)
    console.log(`   - Total Revenue: ${totalRevenue.toLocaleString()} FCFA`)

    // 4. Afficher les œuvres
    console.log('\n📚 Works Details:')
    works.forEach((work, index) => {
      const sales = work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== 'CANCELLED' ? item.quantity : 0)
      }, 0)
      
      const revenue = work.orderItems.reduce((sum, item) => {
        return sum + (item.order && item.order.status !== 'CANCELLED' ? (item.price * item.quantity) : 0)
      }, 0)
      
      console.log(`   ${index + 1}. ${work.title}`)
      console.log(`      - Discipline: ${work.discipline.name}`)
      console.log(`      - Status: ${work.status}`)
      console.log(`      - Author: ${work.author?.name || 'Non assigné'}`)
      console.log(`      - Sales: ${sales}`)
      console.log(`      - Revenue: ${revenue.toLocaleString()} FCFA`)
    })

    console.log('\n🎉 Concepteur data test completed!')

  } catch (error) {
    console.error('❌ Error testing concepteur data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConcepteurData()


