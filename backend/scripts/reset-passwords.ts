// Script pour réinitialiser les mots de passe des utilisateurs existants
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function resetUserPasswords() {
  console.log("🔄 Réinitialisation des mots de passe des utilisateurs existants...")
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    console.log(`📊 ${users.length} utilisateurs trouvés`)
    
    for (const user of users) {
      // Mot de passe par défaut pour tous les utilisateurs
      const defaultPassword = "password123"
      const hashedPassword = await bcrypt.hash(defaultPassword, 12)
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      
      console.log(`✅ ${user.name} (${user.email}) - Mot de passe réinitialisé`)
    }
    
    console.log("\n🎉 Tous les mots de passe ont été réinitialisés!")
    console.log("🔑 Mot de passe par défaut: password123")
    console.log("⚠️ N'oubliez pas de changer ces mots de passe après la première connexion!")
    
  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error)
  }
}

async function createTestUser() {
  console.log("👤 Création d'un utilisateur de test...")
  
  try {
    const testPassword = await bcrypt.hash("test123", 12)
    
    const user = await prisma.user.create({
      data: {
        name: "Utilisateur Test",
        email: "test@example.com",
        password: testPassword,
        role: "CLIENT"
      }
    })
    
    console.log("✅ Utilisateur de test créé:")
    console.log(`   Email: ${user.email}`)
    console.log(`   Mot de passe: test123`)
    console.log(`   Rôle: ${user.role}`)
    
  } catch (error) {
    if (error.code === "P2002") {
      console.log("ℹ️ L'utilisateur test existe déjà")
    } else {
      console.error("❌ Erreur lors de la création:", error)
    }
  }
}

// Fonction principale
async function main() {
  console.log("🚀 Script de gestion des utilisateurs Better Auth")
  console.log("=" * 50)
  
  // Créer un utilisateur de test
  await createTestUser()
  
  console.log("\n" + "=" * 50)
  
  // Réinitialiser les mots de passe existants
  await resetUserPasswords()
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error)
}

export { resetUserPasswords, createTestUser }



