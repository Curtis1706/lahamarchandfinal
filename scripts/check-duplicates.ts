import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Vérification des doublons ISBN...')

    const duplicateIsbns = await prisma.$queryRaw<Array<{ isbn: string; count: bigint }>>`
    SELECT isbn, COUNT(*) as count
    FROM "Work"
    WHERE isbn IS NOT NULL AND isbn != ''
    GROUP BY isbn
    HAVING COUNT(*) > 1
  `

    if (duplicateIsbns.length > 0) {
        console.error('❌ Doublons ISBN détectés :')
        duplicateIsbns.forEach(d => {
            console.error(`   - ISBN: ${d.isbn} (${d.count} occurrences)`)
        })
        process.exit(1)
    }

    console.log('✅ Aucun doublon ISBN détecté.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
