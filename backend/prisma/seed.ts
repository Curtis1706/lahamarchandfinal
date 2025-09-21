import { PrismaClient, Role, WorkStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Créer les disciplines
  const disciplines = await Promise.all([
    prisma.discipline.upsert({
      where: { name: "Mathématiques" },
      update: {},
      create: { name: "Mathématiques" },
    }),
    prisma.discipline.upsert({
      where: { name: "Sciences" },
      update: {},
      create: { name: "Sciences" },
    }),
    prisma.discipline.upsert({
      where: { name: "Littérature" },
      update: {},
      create: { name: "Littérature" },
    }),
    prisma.discipline.upsert({
      where: { name: "Histoire" },
      update: {},
      create: { name: "Histoire" },
    }),
    prisma.discipline.upsert({
      where: { name: "Philosophie" },
      update: {},
      create: { name: "Philosophie" },
    }),
    prisma.discipline.upsert({
      where: { name: "Arts" },
      update: {},
      create: { name: "Arts" },
    }),
    prisma.discipline.upsert({
      where: { name: "Langues" },
      update: {},
      create: { name: "Langues" },
    }),
  ])

  console.log("✅ Disciplines created")

  // Créer les utilisateurs
  const hashedPassword = await bcrypt.hash("password123", 12)

  // PDG (toujours validé)
  const pdg = await prisma.user.upsert({
    where: { email: "pdg@laha.gabon" },
    update: {},
    create: {
      name: "PDG LAHA",
      email: "pdg@laha.gabon",
      password: hashedPassword,
      role: Role.PDG,
      emailVerified: new Date(), // PDG automatiquement validé
    },
  })

  // Concepteurs avec disciplines (certains en attente, d'autres validés)
  const concepteur1 = await prisma.user.upsert({
    where: { email: "marie.nzamba@test.com" },
    update: {},
    create: {
      name: "Dr. Marie Nzamba",
      email: "marie.nzamba@test.com",
      password: hashedPassword,
      role: Role.CONCEPTEUR,
      disciplineId: disciplines[1].id, // Sciences
      emailVerified: null, // En attente de validation PDG
    },
  })

  const concepteur2 = await prisma.user.upsert({
    where: { email: "jean.mbadinga@test.com" },
    update: {},
    create: {
      name: "Prof. Jean Mbadinga",
      email: "jean.mbadinga@test.com",
      password: hashedPassword,
      role: Role.CONCEPTEUR,
      disciplineId: disciplines[0].id, // Mathématiques
      emailVerified: null, // En attente de validation PDG
    },
  })

  const concepteur3 = await prisma.user.upsert({
    where: { email: "sylvie.obame@test.com" },
    update: {},
    create: {
      name: "Mme. Sylvie Obame",
      email: "sylvie.obame@test.com",
      password: hashedPassword,
      role: Role.CONCEPTEUR,
      disciplineId: disciplines[2].id, // Littérature
      emailVerified: new Date(), // Déjà validé par PDG
    },
  })

  const concepteur4 = await prisma.user.upsert({
    where: { email: "paul.ekomy@test.com" },
    update: {},
    create: {
      name: "Dr. Paul Ekomy",
      email: "paul.ekomy@test.com",
      password: hashedPassword,
      role: Role.CONCEPTEUR,
      disciplineId: disciplines[3].id, // Histoire
      emailVerified: null, // En attente de validation PDG
    },
  })

  const concepteur5 = await prisma.user.upsert({
    where: { email: "claire.mba@test.com" },
    update: {},
    create: {
      name: "Prof. Claire Mba",
      email: "claire.mba@test.com",
      password: hashedPassword,
      role: Role.CONCEPTEUR,
      disciplineId: disciplines[4].id, // Philosophie
      emailVerified: new Date(), // Déjà validé par PDG
    },
  })

  // Autres rôles
  const representant = await prisma.user.upsert({
    where: { email: "representant@test.com" },
    update: {},
    create: {
      name: "Représentant Test",
      email: "representant@test.com",
      password: hashedPassword,
      role: Role.REPRESENTANT,
      emailVerified: new Date(), // Validé
    },
  })

  const auteur = await prisma.user.upsert({
    where: { email: "paul.nguema@test.com" },
    update: {},
    create: {
      name: "Dr. Paul Nguema",
      email: "paul.nguema@test.com",
      password: hashedPassword,
      role: Role.AUTEUR,
      emailVerified: new Date(), // Validé
    },
  })

  const client = await prisma.user.upsert({
    where: { email: "client@test.com" },
    update: {},
    create: {
      name: "Client Test",
      email: "client@test.com",
      password: hashedPassword,
      role: Role.CLIENT,
      emailVerified: new Date(), // Clients automatiquement validés
    },
  })

  const partenaire = await prisma.user.upsert({
    where: { email: "partenaire@test.com" },
    update: {},
    create: {
      name: "Partenaire Test",
      email: "partenaire@test.com",
      password: hashedPassword,
      role: Role.PARTENAIRE,
      emailVerified: null, // En attente de validation
    },
  })

  console.log("✅ Users created")

  // Créer des œuvres (seulement pour les concepteurs validés)
  const works = await Promise.all([
    prisma.work.upsert({
      where: { isbn: "978-2-1234-5678-9" },
      update: {},
      create: {
        title: "Contes et Légendes Gabonaises",
        isbn: "978-2-1234-5678-9",
        price: 12500,
        disciplineId: disciplines[2].id, // Littérature
        authorId: auteur.id,
        concepteurId: concepteur3.id, // Sylvie Obame (validée)
        status: WorkStatus.ON_SALE,
      },
    }),
    prisma.work.upsert({
      where: { isbn: "978-2-1234-5679-6" },
      update: {},
      create: {
        title: "Philosophie Africaine Moderne",
        isbn: "978-2-1234-5679-6",
        price: 18000,
        disciplineId: disciplines[4].id, // Philosophie
        authorId: auteur.id,
        concepteurId: concepteur5.id, // Claire Mba (validée)
        status: WorkStatus.ON_SALE,
      },
    }),
  ])

  console.log("✅ Works created")

  // Créer des ventes
  await Promise.all([
    prisma.sale.create({
      data: {
        workId: works[0].id, // Contes et Légendes Gabonaises
        quantity: 8,
        amount: 100000,
      },
    }),
    prisma.sale.create({
      data: {
        workId: works[1].id, // Philosophie Africaine Moderne
        quantity: 3,
        amount: 54000,
      },
    }),
  ])

  console.log("✅ Sales created")

  // Créer des commandes
  const order = await prisma.order.create({
    data: {
      userId: client.id,
      status: "PENDING",
      items: {
        create: [
          {
            workId: works[0].id,
            quantity: 2,
            price: 12500,
          },
          {
            workId: works[1].id,
            quantity: 1,
            price: 18000,
          },
        ],
      },
    },
  })

  console.log("✅ Orders created")

  // Créer des royalties
  await Promise.all([
    prisma.royalty.create({
      data: {
        workId: works[0].id,
        userId: auteur.id,
        amount: 15000, // 15% de 100000
        paid: false,
      },
    }),
    prisma.royalty.create({
      data: {
        workId: works[1].id,
        userId: auteur.id,
        amount: 8100, // 15% de 54000
        paid: false,
      },
    }),
  ])

  console.log("✅ Royalties created")

  console.log("🎉 Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

