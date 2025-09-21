import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function setupAuthorTestData() {
  try {
    console.log("🎭 Setting up author test data...")

    // Trouver l'auteur
    const author = await prisma.user.findUnique({
      where: { email: "auteur@lahamarchand.com" }
    })

    if (!author) {
      console.log("❌ Author not found. Please create the author account first.")
      return
    }

    console.log("✅ Found author:", author.name)

    // Vérifier les œuvres existantes
    const existingWorks = await prisma.work.findMany({
      where: { authorId: author.id },
      include: { discipline: true }
    })

    console.log(`📚 Found ${existingWorks.length} existing works`)

    if (existingWorks.length === 0) {
      console.log("📚 Creating sample works...")
      
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
    }

    // Créer des commandes et royalties pour les œuvres
    console.log("💰 Creating sample orders and royalties...")

    const authorWorks = await prisma.work.findMany({
      where: { authorId: author.id }
    })

    // Trouver un client pour créer des commandes
    const client = await prisma.user.findFirst({
      where: { role: "CLIENT" }
    })

    if (client && authorWorks.length > 0) {
      // Créer quelques commandes pour générer des ventes
      for (let i = 0; i < 3; i++) {
        const work = authorWorks[i % authorWorks.length]
        
        const quantity = Math.floor(Math.random() * 5) + 1 // 1-5 exemplaires
        
        const order = await prisma.order.create({
          data: {
            userId: client.id,
            status: "DELIVERED"
          }
        })

        // Créer l'item de commande
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            workId: work.id,
            quantity: quantity,
            price: work.price
          }
        })

        console.log(`🛒 Created order for "${work.title}"`)

        // Créer des royalties pour cette œuvre
        const royaltyAmount = Math.floor(work.price * 0.15 * quantity) // 15% de royalty
        
        await prisma.royalty.create({
          data: {
            workId: work.id,
            userId: author.id,
            amount: royaltyAmount,
            paid: Math.random() > 0.5, // 50% de chance d'être payé
            createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) // -60 jours max
          }
        })

        console.log(`💰 Created royalty: ${royaltyAmount} FCFA for "${work.title}"`)
      }
    }

    console.log("\n🎉 Author test data setup completed!")
    console.log("\n📋 Login credentials:")
    console.log("📧 Email: auteur@lahamarchand.com")
    console.log("🔑 Password: auteur123")
    console.log("\n🚀 You can now login and test the author dashboard!")

  } catch (error) {
    console.error("❌ Error setting up author test data:", error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAuthorTestData()
