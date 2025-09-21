import { PrismaClient, Role, WorkStatus, OrderStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function seedMoreData() {
  console.log("🌱 Adding more test data...")

  // Récupérer les utilisateurs et disciplines existants
  const client = await prisma.user.findUnique({ where: { email: "client@lahamarchand.com" } })
  const auteur = await prisma.user.findUnique({ where: { email: "auteur@lahamarchand.com" } })
  const concepteur = await prisma.user.findUnique({ where: { email: "concepteur@lahamarchand.com" } })
  const disciplines = await prisma.discipline.findMany()

  if (!client || !auteur || !concepteur) {
    console.log("❌ Base users not found. Run main seed first.")
    return
  }

  // Créer plus de livres
  const moreBooks = [
    {
      title: "Économie du Gabon au XXIe Siècle",
      isbn: "978-2-1234-5681-9",
      price: 22000,
      disciplineId: disciplines.find(d => d.name === "Sciences")?.id!,
    },
    {
      title: "Poésie Contemporaine Gabonaise",
      isbn: "978-2-1234-5682-6",
      price: 14500,
      disciplineId: disciplines.find(d => d.name === "Littérature")?.id!,
    },
    {
      title: "Art Traditionnel et Moderne au Gabon",
      isbn: "978-2-1234-5683-3",
      price: 19500,
      disciplineId: disciplines.find(d => d.name === "Arts")?.id!,
    },
    {
      title: "Philosophie Africaine Moderne",
      isbn: "978-2-1234-5684-0",
      price: 17000,
      disciplineId: disciplines.find(d => d.name === "Philosophie")?.id!,
    },
    {
      title: "Les Grandes Figures de l'Histoire Gabonaise",
      isbn: "978-2-1234-5685-7",
      price: 16800,
      disciplineId: disciplines.find(d => d.name === "Histoire")?.id!,
    },
    {
      title: "Mathématiques pour l'Ingénieur",
      isbn: "978-2-1234-5686-4",
      price: 25000,
      disciplineId: disciplines.find(d => d.name === "Sciences")?.id!,
    },
    {
      title: "Romans et Nouvelles du Gabon",
      isbn: "978-2-1234-5687-1",
      price: 13200,
      disciplineId: disciplines.find(d => d.name === "Littérature")?.id!,
    },
    {
      title: "Sculpture sur Bois Gabonaise",
      isbn: "978-2-1234-5688-8",
      price: 21000,
      disciplineId: disciplines.find(d => d.name === "Arts")?.id!,
    },
  ]

  const createdBooks = []
  for (const book of moreBooks) {
    const work = await prisma.work.create({
      data: {
        ...book,
        authorId: auteur.id,
        concepteurId: concepteur.id,
        status: WorkStatus.ON_SALE,
      },
    })
    createdBooks.push(work)
  }

  console.log(`✅ Created ${createdBooks.length} more books`)

  // Créer plus de commandes pour le client
  const moreOrders = [
    {
      status: OrderStatus.DELIVERED,
      items: [
        { workId: createdBooks[0].id, quantity: 1, price: createdBooks[0].price },
        { workId: createdBooks[1].id, quantity: 2, price: createdBooks[1].price },
      ],
      createdAt: new Date("2024-01-15"),
    },
    {
      status: OrderStatus.DELIVERED,
      items: [
        { workId: createdBooks[2].id, quantity: 1, price: createdBooks[2].price },
      ],
      createdAt: new Date("2024-02-10"),
    },
    {
      status: OrderStatus.VALIDATED,
      items: [
        { workId: createdBooks[3].id, quantity: 1, price: createdBooks[3].price },
        { workId: createdBooks[4].id, quantity: 1, price: createdBooks[4].price },
      ],
      createdAt: new Date("2024-03-05"),
    },
    {
      status: OrderStatus.PENDING,
      items: [
        { workId: createdBooks[5].id, quantity: 1, price: createdBooks[5].price },
      ],
      createdAt: new Date("2024-03-20"),
    },
  ]

  for (const orderData of moreOrders) {
    await prisma.order.create({
      data: {
        userId: client.id,
        status: orderData.status,
        createdAt: orderData.createdAt,
        items: {
          create: orderData.items
        }
      }
    })
  }

  console.log(`✅ Created ${moreOrders.length} more orders`)

  // Créer des ventes pour les nouveaux livres
  for (let i = 0; i < createdBooks.length; i++) {
    const book = createdBooks[i]
    const quantity = Math.floor(Math.random() * 10) + 1
    await prisma.sale.create({
      data: {
        workId: book.id,
        quantity,
        amount: book.price * quantity,
      }
    })
  }

  console.log("✅ Created more sales data")
  console.log("🎉 Additional test data seeded successfully!")
}

// Exécuter le seeding
if (require.main === module) {
  seedMoreData()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { seedMoreData }



