import { prisma } from "@/lib/prisma"

async function cleanupTestUsers() {
  console.log("🧹 Nettoyage des utilisateurs de test")
  
  try {
    // Supprimer les utilisateurs de test
    const testEmails = [
      "test@example.com",
      "test-direct@example.com", 
      "test-api@example.com",
      "alhtdharry7@gmail.com" // L'email de l'utilisateur qui essaie de s'inscrire
    ]
    
    for (const email of testEmails) {
      const deleted = await prisma.user.deleteMany({
        where: { email }
      })
      
      if (deleted.count > 0) {
        console.log(`✅ Supprimé: ${email} (${deleted.count} utilisateur(s))`)
      } else {
        console.log(`ℹ️  Pas trouvé: ${email}`)
      }
    }
    
    console.log("\n🎉 Nettoyage terminé ! Vous pouvez maintenant tester l'inscription.")
    
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le nettoyage
if (require.main === module) {
  cleanupTestUsers().catch(console.error)
}

export { cleanupTestUsers }



