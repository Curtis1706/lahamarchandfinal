const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFinancialData() {
  console.log('🔍 Vérification des données financières...');
  
  try {
    // Vérifier les commandes
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            work: {
              include: {
                discipline: true
              }
            }
          }
        }
      }
    });
    
    console.log(`📦 Commandes trouvées: ${orders.length}`);
    orders.forEach(order => {
      const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      console.log(`  - Commande ${order.id}: ${order.status}, ${order.items.length} articles, Total: ${total} FCFA`);
      order.items.forEach(item => {
        console.log(`    * ${item.work?.title || 'Œuvre inconnue'}: ${item.quantity} × ${item.price} FCFA`);
      });
    });
    
    // Vérifier les ventes
    const sales = await prisma.sale.findMany({
      include: {
        work: true
      }
    });
    console.log(`💰 Ventes trouvées: ${sales.length}`);
    sales.forEach(sale => {
      console.log(`  - Vente ${sale.id}: ${sale.quantity} articles, ${sale.amount} FCFA, Œuvre: ${sale.work?.title || 'Inconnue'}`);
    });
    
    // Calculer le chiffre d'affaires total
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
    console.log(`📊 Chiffre d'affaires total: ${totalSales} FCFA`);
    
    // Vérifier les œuvres
    const works = await prisma.work.findMany({
      include: {
        discipline: true,
        author: true
      }
    });
    console.log(`📚 Œuvres trouvées: ${works.length}`);
    works.forEach(work => {
      console.log(`  - ${work.title}: ${work.price} FCFA, Statut: ${work.status}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinancialData();
