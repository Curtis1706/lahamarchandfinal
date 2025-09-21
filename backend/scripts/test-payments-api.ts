import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testPaymentsAPI() {
  try {
    const author = await prisma.user.findUnique({ 
      where: { email: 'auteur@test.com' } 
    })
    
    if (!author) { 
      console.log('❌ Author not found')
      return 
    }
    
    const royalties = await prisma.royalty.findMany({
      where: { userId: author.id },
      include: { 
        work: { 
          select: { 
            title: true, 
            discipline: { select: { name: true } } 
          } 
        } 
      }
    })
    
    const stats = {
      totalRoyalties: royalties.reduce((sum, r) => sum + r.amount, 0),
      paidRoyalties: royalties.filter(r => r.paid).reduce((sum, r) => sum + r.amount, 0),
      pendingRoyalties: royalties.filter(r => !r.paid).reduce((sum, r) => sum + r.amount, 0),
      totalPayments: royalties.filter(r => r.paid).length,
      pendingPayments: royalties.filter(r => !r.paid).length
    }
    
    console.log('📊 Payment Stats:')
    console.log('💰 Total Royalties:', stats.totalRoyalties.toLocaleString(), 'FCFA')
    console.log('✅ Paid:', stats.paidRoyalties.toLocaleString(), 'FCFA')
    console.log('⏳ Pending:', stats.pendingRoyalties.toLocaleString(), 'FCFA')
    console.log('📈 Total Payments:', stats.totalPayments)
    console.log('⏳ Pending Payments:', stats.pendingPayments)
    
    console.log('\n📋 Royalties Details:')
    royalties.forEach((royalty, index) => {
      console.log(`${index + 1}. ${royalty.work.title}`)
      console.log(`   Amount: ${royalty.amount.toLocaleString()} FCFA`)
      console.log(`   Paid: ${royalty.paid ? 'Yes' : 'No'}`)
      console.log(`   Date: ${royalty.createdAt.toLocaleDateString()}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPaymentsAPI()


