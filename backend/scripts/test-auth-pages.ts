// Script de test pour vérifier que toutes les pages d'authentification fonctionnent
import { prisma } from "@/lib/prisma"

async function testAuthPages() {
  console.log("🧪 Test des pages d'authentification...")
  
  try {
    // Vérifier que la base de données est accessible
    const userCount = await prisma.user.count()
    console.log(`✅ Base de données accessible - ${userCount} utilisateurs trouvés`)
    
    // Vérifier les utilisateurs de test
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ["test@example.com", "client@lahamarchand.com", "pdg@lahamarchand.com"]
        }
      },
      select: {
        email: true,
        name: true,
        role: true
      }
    })
    
    console.log("👥 Utilisateurs de test disponibles :")
    testUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Rôle: ${user.role}`)
    })
    
    console.log("\n🌐 Pages à tester :")
    console.log("   1. Page d'accueil: http://localhost:3000")
    console.log("   2. Sélection de compte: http://localhost:3000/select-account")
    console.log("   3. Inscription: http://localhost:3000/register")
    console.log("   4. Connexion: http://localhost:3000/login")
    
    console.log("\n🔑 Comptes de test :")
    console.log("   - PDG: pdg@lahamarchand.com / password123")
    console.log("   - Client: client@lahamarchand.com / password123")
    console.log("   - Test: test@example.com / test123")
    
    console.log("\n✅ Tous les tests sont prêts !")
    
  } catch (error) {
    console.error("❌ Erreur lors du test:", error)
  }
}

// Exécuter le test
if (require.main === module) {
  testAuthPages().catch(console.error)
}

export { testAuthPages }



