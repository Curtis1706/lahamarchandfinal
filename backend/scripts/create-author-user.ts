import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createAuthorUser() {
  try {
    console.log("🎭 Creating author user...")

    // Vérifier si l'auteur existe déjà
    let author = await prisma.user.findUnique({
      where: { email: "auteur@lahamarchand.com" }
    })

    if (!author) {
      // Créer le mot de passe hashé
      const hashedPassword = await bcrypt.hash("auteur123", 12)

      // Créer l'utilisateur auteur
      author = await prisma.user.create({
        data: {
          name: "Paul AUTEUR",
          email: "auteur@lahamarchand.com",
          password: hashedPassword,
          role: "AUTEUR",
          emailVerified: true
        }
      })

      console.log("✅ Author user created:", author.name)
    } else {
      console.log("✅ Author user already exists:", author.name)
    }

    console.log("\n📋 Login credentials:")
    console.log("📧 Email: auteur@lahamarchand.com")
    console.log("🔑 Password: auteur123")
    console.log("🎭 Role:", author.role)

  } catch (error) {
    console.error("❌ Error creating author user:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAuthorUser()



