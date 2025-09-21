// Test de création d'utilisateur direct avec Prisma
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function testPrismaUserCreation() {
  console.log("🧪 Test de création d'utilisateur avec Prisma")
  
  try {
    const hashedPassword = await bcrypt.hash("test123456", 10)
    
    const user = await prisma.user.create({
      data: {
        name: "Test Prisma User",
        email: "test-prisma@example.com",
        password: hashedPassword,
        role: "CLIENT",
        emailVerified: false
      }
    })
    
    console.log("✅ Utilisateur créé avec Prisma:", user)
    
    // Nettoyer après le test
    await prisma.user.delete({
      where: { id: user.id }
    })
    
    console.log("✅ Utilisateur supprimé après test")
    
  } catch (error) {
    console.error("❌ Erreur Prisma:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
if (require.main === module) {
  testPrismaUserCreation().catch(console.error)
}

export { testPrismaUserCreation }



