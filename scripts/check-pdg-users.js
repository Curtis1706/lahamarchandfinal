const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPDG() {
  try {
    const pdgUsers = await prisma.user.findMany({
      where: { role: 'PDG' },
      select: { id: true, name: true, email: true, role: true }
    });
    
    console.log('🔍 Utilisateurs PDG trouvés:', pdgUsers.length);
    pdgUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
    });
    
    if (pdgUsers.length === 0) {
      console.log('❌ Aucun utilisateur PDG trouvé !');
    }
    
    // Vérifier aussi l'utilisateur spécifique du token
    const specificPDG = await prisma.user.findUnique({
      where: { id: 'cmfu9p1m20007ul7oddl2cj77' },
      select: { id: true, name: true, email: true, role: true }
    });
    
    console.log('\n🔍 Utilisateur PDG spécifique (cmfu9p1m20007ul7oddl2cj77):');
    if (specificPDG) {
      console.log(`   ✅ Trouvé: ${specificPDG.name} (${specificPDG.email}) - Rôle: ${specificPDG.role}`);
    } else {
      console.log('   ❌ Non trouvé !');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
  }
}

checkPDG();
