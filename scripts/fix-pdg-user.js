const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPDGUser() {
  try {
    console.log('🔧 Correction de l\'utilisateur PDG...');
    
    // Vérifier l'utilisateur PDG existant
    const existingPDG = await prisma.user.findUnique({
      where: { id: 'cmg0usjvr0008ulzw5iiwpr8d' },
      select: { id: true, name: true, email: true, role: true }
    });
    
    if (existingPDG) {
      console.log(`✅ Utilisateur PDG existant: ${existingPDG.name} (${existingPDG.email})`);
      
      // Mettre à jour l'email pour correspondre au token
      const updatedPDG = await prisma.user.update({
        where: { id: 'cmg0usjvr0008ulzw5iiwpr8d' },
        data: {
          email: 'pdg@laha.gabon',
          name: 'PDG LAHA'
        },
        select: { id: true, name: true, email: true, role: true }
      });
      
      console.log(`✅ Utilisateur PDG mis à jour: ${updatedPDG.name} (${updatedPDG.email})`);
    } else {
      console.log('❌ Utilisateur PDG non trouvé !');
    }
    
    // Vérifier tous les utilisateurs PDG
    const allPDGUsers = await prisma.user.findMany({
      where: { role: 'PDG' },
      select: { id: true, name: true, email: true, role: true }
    });
    
    console.log('\n📋 Tous les utilisateurs PDG:');
    allPDGUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.$disconnect();
  }
}

fixPDGUser();
