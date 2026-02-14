import { PrismaClient, ClientType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding ClientTypeConfig...')

    const configs = [
        {
            clientType: 'particulier' as ClientType,
            label: 'Particulier',
            description: 'Clients individuels achetant au prix public.',
            minimumOrderQuantity: 1,
            minimumOrderAmount: 0,
        },
        {
            clientType: 'boutique' as ClientType,
            label: 'Boutique',
            description: 'Points de vente et boutiques.',
            minimumOrderQuantity: 1,
            minimumOrderAmount: 0,
        },
        {
            clientType: 'grossiste' as ClientType,
            label: 'Grossiste',
            description: 'Revendeurs en gros.',
            minimumOrderQuantity: 1,
            minimumOrderAmount: 0,
        },
        {
            clientType: 'ecole_contractuelle' as ClientType,
            label: 'École Contractuelle',
            description: 'Établissements scolaires sous contrat.',
            minimumOrderQuantity: 1,
            minimumOrderAmount: 0,
        },
        {
            clientType: 'ecole_non_contractuelle' as ClientType,
            label: 'École Non Contractuelle',
            description: 'Établissements scolaires hors contrat.',
            minimumOrderQuantity: 1,
            minimumOrderAmount: 0,
        },
        {
            clientType: 'partenaire' as ClientType,
            label: 'Partenaire',
            description: 'Partenaires stratégiques.',
            minimumOrderQuantity: 1,
            minimumOrderAmount: 0,
        },
        {
            clientType: 'bibliotheque' as ClientType,
            label: 'Bibliothèque',
            description: 'Bibliothèques publiques ou privées.',
            minimumOrderQuantity: 1,
            minimumOrderAmount: 0,
        },
    ]

    for (const config of configs) {
        await prisma.clientTypeConfig.upsert({
            where: { clientType: config.clientType },
            update: config,
            create: config,
        })
        console.log(`✅ Configuré : ${config.label}`)
    }

    console.log('✨ Seeding terminé.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
