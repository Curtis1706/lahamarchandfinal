import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const departments = [
    // Estuaire
    { name: 'Akanda', description: 'Akanda' },
    { name: 'Komo', description: 'Kango' },
    { name: 'Komo-Mondah', description: 'Ntoum' },
    { name: 'Komo-Océan', description: 'Ndzomoe' },
    { name: 'Noya', description: 'Cocobeach' },

    // Haut-Ogooué
    { name: 'Bayi-Brikolo', description: 'Aboumi' },
    { name: 'Djoué', description: 'Onga' },
    { name: 'Djouori-Agnili', description: 'Bongoville' },
    { name: 'Lemboumbi-Leyou', description: 'Moanda' },
    { name: 'Lékabi-Léwolo', description: 'Ngouoni' },
    { name: 'Lékoko', description: 'Bakoumba' },
    { name: 'Lékoni-Lékori', description: 'Akiéni' },
    { name: 'Mpassa', description: 'Franceville' },
    { name: 'Ogooué-Létili', description: 'Boumango' },
    { name: 'Plateaux', description: 'Lékoni' },
    { name: 'Sébé-Brikolo', description: 'Okondja' },

    // Moyen-Ogooué
    { name: 'Abanga-Bigné', description: 'Ndjolé' },
    { name: 'Ogooué et des Lacs', description: 'Lambaréné' },

    // Ngounié
    { name: 'Boumi-Louetsi', description: 'Mbigou' },
    { name: 'Dola', description: 'Ndendé' },
    { name: 'Douya-Onoye', description: 'Mouila' },
    { name: 'Louetsi-Bibaka', description: 'Malinga' },
    { name: 'Louetsi-Wano', description: 'Lébamba' },
    { name: 'Mougalaba', description: 'Guiétsou' },
    { name: 'Ndolou', description: 'Mandji' },
    { name: 'Ogoulou', description: 'Mimongo' },
    { name: 'Tsamba-Magotsi', description: 'Fougamou' },

    // Nyanga
    { name: 'Basse-Banio', description: 'Mayumba' },
    { name: 'Douigny', description: 'Moabi' },
    { name: 'Doutsila', description: 'Mabanda' },
    { name: 'Haute-Banio', description: 'Ndindi' },
    { name: 'Mongo', description: 'Moulengui-Binza' },
    { name: 'Mougoutsi', description: 'Tchibanga' },

    // Ogooué-Ivindo
    { name: 'Ivindo', description: 'Makokou' },
    { name: 'Lopé', description: 'Booué' },
    { name: 'Mvoung', description: 'Ovan' },
    { name: 'Zadié', description: 'Mékambo' },

    // Ogooué-Lolo
    { name: 'Lolo-Bouenguidi', description: 'Koulamoutou' },
    { name: 'Lombo-Bouenguidi', description: 'Pana' },
    { name: 'Mulundu', description: 'Lastoursville' },
    { name: 'Offoué-Onoye', description: 'Iboundji' },

    // Ogooué-Maritime
    { name: 'Bendjé', description: 'Port-Gentil' },
    { name: 'Etimboué', description: 'Omboué' },
    { name: 'Ndougou', description: 'Gamba' },

    // Woleu-Ntem
    { name: 'Haut-Komo', description: 'Médouneu' },
    { name: 'Haut-Ntem', description: 'Minvoul' },
    { name: 'Ntem', description: 'Bitam' },
    { name: 'Okano', description: 'Mitzic' },
    { name: 'Woleu', description: 'Oyem' },
]

async function main() {
    console.log('🚀 Démarrage de la mise à jour des départements...')

    // Marquer tous les départements existants comme inactifs
    await prisma.discipline.updateMany({
        data: { isActive: false }
    })

    let createdCount = 0
    let updatedCount = 0

    for (const dept of departments) {
        const existing = await prisma.discipline.findUnique({
            where: { name: dept.name }
        })

        if (existing) {
            await prisma.discipline.update({
                where: { id: existing.id },
                data: {
                    description: dept.description,
                    isActive: true
                }
            })
            updatedCount++
        } else {
            await prisma.discipline.create({
                data: {
                    name: dept.name,
                    description: dept.description,
                    isActive: true,
                },
            })
            createdCount++
        }
    }

    console.log(`✅ Terminés ! ${createdCount} créés, ${updatedCount} mis à jour.`)
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors du seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
