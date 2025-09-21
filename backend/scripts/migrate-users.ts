// Script pour vérifier et migrer les utilisateurs existants
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function checkExistingUsers() {
  console.log("🔍 Vérification des utilisateurs existants...")
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        createdAt: true
      }
    })
    
    console.log(`📊 ${users.length} utilisateurs trouvés:`)
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Rôle: ${user.role}`)
      console.log(`   Mot de passe hashé: ${user.password.substring(0, 20)}...`)
      console.log(`   Créé le: ${user.createdAt}`)
      console.log("")
    })
    
    return users
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error)
    return []
  }
}

async function testPasswordVerification(email: string, password: string) {
  console.log(`🔐 Test de vérification du mot de passe pour ${email}...`)
  
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      console.log("❌ Utilisateur non trouvé")
      return false
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    console.log(`✅ Mot de passe valide: ${isValid}`)
    
    return isValid
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error)
    return false
  }
}

async function migrateUserPassword(email: string, newPassword: string) {
  console.log(`🔄 Migration du mot de passe pour ${email}...`)
  
  try {
    // Hash le nouveau mot de passe avec bcrypt (compatible avec Better Auth)
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })
    
    console.log("✅ Mot de passe migré avec succès")
    return true
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error)
    return false
  }
}

// Fonction principale
async function main() {
  console.log("🚀 Script de migration des utilisateurs Better Auth")
  console.log("=" * 50)
  
  // Vérifier les utilisateurs existants
  const users = await checkExistingUsers()
  
  if (users.length === 0) {
    console.log("ℹ️ Aucun utilisateur existant trouvé")
    return
  }
  
  // Test avec le premier utilisateur (vous pouvez modifier l'email)
  const testEmail = users[0].email
  const testPassword = "motdepasse123" // Remplacez par le vrai mot de passe
  
  console.log(`\n🧪 Test avec l'utilisateur: ${testEmail}`)
  const isValid = await testPasswordVerification(testEmail, testPassword)
  
  if (!isValid) {
    console.log("⚠️ Le mot de passe ne correspond pas. Migration nécessaire.")
    console.log("💡 Vous pouvez utiliser la fonction migrateUserPassword() pour migrer")
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error)
}

export { checkExistingUsers, testPasswordVerification, migrateUserPassword }



