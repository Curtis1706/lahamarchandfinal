import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDuplicateWorks() {
  try {
    console.log('🧹 Cleaning up duplicate works...')

    // Trouver l'auteur
    const author = await prisma.user.findUnique({
      where: { email: 'auteur@test.com' }
    })

    if (!author) {
      console.log('❌ Author not found')
      return
    }

    // Trouver toutes les œuvres de l'auteur
    const works = await prisma.work.findMany({
      where: { authorId: author.id },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`Found ${works.length} works for author`)

    // Grouper par titre
    const worksByTitle = new Map()
    works.forEach(work => {
      if (!worksByTitle.has(work.title)) {
        worksByTitle.set(work.title, [])
      }
      worksByTitle.get(work.title).push(work)
    })

    // Supprimer les doublons (garder le plus ancien)
    for (const [title, workList] of worksByTitle) {
      if (workList.length > 1) {
        console.log(`📚 Found ${workList.length} duplicates for "${title}"`)
        
        // Garder le premier (plus ancien), supprimer les autres
        const toKeep = workList[0]
        const toDelete = workList.slice(1)
        
        console.log(`   Keeping: ${toKeep.id} (created: ${toKeep.createdAt})`)
        
        for (const work of toDelete) {
          console.log(`   Deleting: ${work.id} (created: ${work.createdAt})`)
          
          // Supprimer les royalties associées
          await prisma.royalty.deleteMany({
            where: { workId: work.id }
          })
          
          // Supprimer les order items associés
          await prisma.orderItem.deleteMany({
            where: { workId: work.id }
          })
          
          // Supprimer l'œuvre
          await prisma.work.delete({
            where: { id: work.id }
          })
        }
      }
    }

    console.log('✅ Cleanup completed!')

    // Vérifier le résultat
    const remainingWorks = await prisma.work.findMany({
      where: { authorId: author.id }
    })

    console.log(`📊 Remaining works: ${remainingWorks.length}`)
    remainingWorks.forEach(work => {
      console.log(`   - ${work.title} (${work.status})`)
    })

  } catch (error) {
    console.error('❌ Error cleaning up:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicateWorks()


