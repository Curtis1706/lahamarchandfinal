import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createAuthorAccount() {
  try {
    console.log("🎭 Creating author account...")

    // Vérifier si l'auteur existe déjà
    const existingAuthor = await prisma.user.findUnique({
      where: { email: "auteur@lahamarchand.com" }
    })

    if (existingAuthor) {
      console.log("✅ Author account already exists:", existingAuthor.name)
      console.log("📧 Email:", existingAuthor.email)
      console.log("🎭 Role:", existingAuthor.role)
      return existingAuthor
    }

    // Créer le mot de passe hashé
    const hashedPassword = await bcrypt.hash("auteur123", 12)

    // Créer l'utilisateur auteur
    const author = await prisma.user.create({
      data: {
        name: "Marie AUTEUR",
        email: "auteur@lahamarchand.com",
        password: hashedPassword,
        role: "AUTEUR",
        emailVerified: true
      }
    })

    console.log("✅ Author account created successfully!")
    console.log("👤 Name:", author.name)
    console.log("📧 Email:", author.email)
    console.log("🎭 Role:", author.role)
    console.log("🔑 Password: auteur123")

    // Créer quelques œuvres pour cet auteur
    console.log("\n📚 Creating sample works for the author...")

    // Récupérer une discipline
    const discipline = await prisma.discipline.findFirst()
    if (!discipline) {
      console.log("❌ No discipline found. Please run the main seed first.")
      return
    }

    // Créer des œuvres d'exemple
    const works = [
      {
        title: "Histoire du Gabon Moderne",
        isbn: "978-2-123456-78-9",
        price: 15000,
        disciplineId: discipline.id,
        authorId: author.id,
        status: "ON_SALE"
      },
      {
        title: "Contes et Légendes Gabonaises",
        isbn: "978-2-123456-79-6",
        price: 12000,
        disciplineId: discipline.id,
        authorId: author.id,
        status: "ON_SALE"
      },
      {
        title: "Géographie du Gabon",
        isbn: "978-2-123456-80-2",
        price: 18000,
        disciplineId: discipline.id,
        authorId: author.id,
        status: "ACCEPTED"
      },
      {
        title: "Sciences Naturelles du Gabon",
        isbn: "978-2-123456-81-9",
        price: 20000,
        disciplineId: discipline.id,
        authorId: author.id,
        status: "SUBMITTED"
      }
    ]

    for (const workData of works) {
      const work = await prisma.work.create({
        data: workData,
        include: {
          discipline: true
        }
      })
      console.log(`📖 Created work: "${work.title}" (${work.discipline.name})`)
    }

    // Créer quelques royalties pour les œuvres
    console.log("\n💰 Creating sample royalties...")

    const authorWorks = await prisma.work.findMany({
      where: { authorId: author.id }
    })

    for (const work of authorWorks) {
      // Créer quelques royalties (certaines payées, d'autres en attente)
      const royalties = [
        {
          workId: work.id,
          userId: author.id,
          amount: Math.floor(work.price * 0.15 * 10), // 15% de 10 ventes
          paid: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // -30 jours
        },
        {
          workId: work.id,
          userId: author.id,
          amount: Math.floor(work.price * 0.15 * 5), // 15% de 5 ventes
          paid: false,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // -15 jours
        }
      ]

      for (const royaltyData of royalties) {
        await prisma.royalty.create({
          data: royaltyData
        })
      }
    }

    console.log("\n🎉 Author account setup completed!")
    console.log("\n📋 Login credentials:")
    console.log("📧 Email: auteur@lahamarchand.com")
    console.log("🔑 Password: auteur123")
    console.log("\n🚀 You can now login and test the author dashboard!")

  } catch (error) {
    console.error("❌ Error creating author account:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAuthorAccount()



