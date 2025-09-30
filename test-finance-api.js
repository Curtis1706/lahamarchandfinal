const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFinanceAPI() {
  console.log('🧪 Test de l\'API financière...');
  
  try {
    // Simuler la logique de l'API loadOverviewData
    console.log('\n📊 Test des données de vue d\'ensemble:');
    
    // Calculer le chiffre d'affaires total (ventes + commandes livrées)
    const totalSalesFromSales = await prisma.sale.aggregate({
      _sum: {
        amount: true
      }
    })

    const deliveredOrders = await prisma.order.findMany({
      where: { status: 'DELIVERED' },
      include: {
        items: true
      }
    })

    const totalSalesFromOrders = deliveredOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.price * item.quantity)
      }, 0)
    }, 0)

    const totalSales = (totalSalesFromSales._sum.amount || 0) + totalSalesFromOrders

    console.log(`💰 Chiffre d'affaires total: ${totalSales} FCFA`);
    console.log(`   - Ventes directes: ${totalSalesFromSales._sum.amount || 0} FCFA`);
    console.log(`   - Commandes livrées: ${totalSalesFromOrders} FCFA`);

    // Nombre total de commandes
    const totalOrders = await prisma.order.count()
    console.log(`📦 Total commandes: ${totalOrders}`);

    // Nombre total d'œuvres
    const totalWorks = await prisma.work.count()
    console.log(`📚 Total œuvres: ${totalWorks}`);

    // Nombre total de partenaires
    const totalPartners = await prisma.user.count({ where: { role: 'PARTENAIRE' } })
    console.log(`🏢 Total partenaires: ${totalPartners}`);

    // Panier moyen
    const ordersWithTotal = await prisma.order.findMany({ include: { items: true } })
    const totalOrderValue = ordersWithTotal.reduce((sum, order) => {
      const orderTotal = order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0)
      return sum + orderTotal
    }, 0)
    const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0
    console.log(`🛒 Panier moyen: ${Math.round(avgOrderValue)} FCFA`);

    console.log('\n✅ Test terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinanceAPI();
