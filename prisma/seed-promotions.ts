import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPromotions() {
  console.log('🌱 Seeding promotions...')

  // Créer des promotions par défaut
  const promotions = [
    {
      libelle: 'CAMPAGNE PRIMAIRE 2025',
      code: 'PRIMAIRE25',
      periode: 'Du 29 mai 2025 au 29 mai 2026',
      livre: 'Tous les livres primaires',
      statut: 'ACTIF' as const,
      taux: '200 F CFA',
      quantiteMinimale: 1,
      createdBy: 'PDG Administrateur',
      description: 'Promotion pour la rentrée scolaire primaire 2025'
    },
    {
      libelle: 'COFFRET SIMPLE',
      code: 'COFPRIMAIRE25',
      periode: 'Du 10 mai 2025 au 1 juin 2026',
      livre: 'Coffrets primaires',
      statut: 'ACTIF' as const,
      taux: '350 F CFA',
      quantiteMinimale: 1,
      createdBy: 'PDG Administrateur',
      description: 'Réduction sur les coffrets de livres primaires'
    },
    {
      libelle: 'COFFRET ANNALES',
      code: 'ANLPRIMAIRE25',
      periode: "Jusqu'au 1 juin 2026",
      livre: 'Annales primaires',
      statut: 'ACTIF' as const,
      taux: '300 F CFA',
      quantiteMinimale: 1,
      createdBy: 'PDG Administrateur',
      description: 'Promotion sur les annales du primaire'
    }
  ]

  for (const promo of promotions) {
    const existing = await prisma.promotion.findUnique({
      where: { code: promo.code }
    })

    if (!existing) {
      const created = await prisma.promotion.create({
        data: promo
      })
      console.log(`✅ Promotion créée: ${created.code}`)
    } else {
      console.log(`ℹ️  Promotion existe déjà: ${promo.code}`)
    }
  }

  console.log('✅ Seeding promotions terminé!')
}

seedPromotions()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



