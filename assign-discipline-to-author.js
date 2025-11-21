const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function assignDisciplineToAuthor() {
  try {
    const args = process.argv.slice(2)
    
    if (args.length < 2) {
      console.log('📝 Usage: node assign-discipline-to-author.js <email_auteur> <nom_discipline>')
      console.log('\nExemple: node assign-discipline-to-author.js serge10@gmail.com "Français"')
      console.log('\n📚 Disciplines disponibles:')
      
      const disciplines = await prisma.discipline.findMany({
        orderBy: { name: 'asc' }
      })
      
      disciplines.forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.name}`)
      })
      
      await prisma.$disconnect()
      return
    }
    
    const authorEmail = args[0]
    const disciplineName = args[1]
    
    console.log(`🔍 Recherche de l'auteur: ${authorEmail}`)
    const author = await prisma.user.findUnique({
      where: { email: authorEmail },
      include: { discipline: true }
    })
    
    if (!author) {
      console.log(`❌ Auteur non trouvé: ${authorEmail}`)
      await prisma.$disconnect()
      return
    }
    
    if (author.role !== 'AUTEUR') {
      console.log(`❌ L'utilisateur ${authorEmail} n'est pas un auteur (rôle: ${author.role})`)
      await prisma.$disconnect()
      return
    }
    
    console.log(`✅ Auteur trouvé: ${author.name}`)
    if (author.discipline) {
      console.log(`   Discipline actuelle: ${author.discipline.name}`)
    }
    
    console.log(`\n🔍 Recherche de la discipline: ${disciplineName}`)
    // Essayer de trouver par nom exact d'abord
    let discipline = await prisma.discipline.findFirst({
      where: { name: disciplineName }
    })
    
    // Si pas trouvé, essayer avec une recherche insensible à la casse
    if (!discipline) {
      const allDisciplines = await prisma.discipline.findMany()
      discipline = allDisciplines.find(d => 
        d.name.toLowerCase() === disciplineName.toLowerCase() ||
        d.name.includes(disciplineName) ||
        disciplineName.includes(d.name)
      )
    }
    
    if (!discipline) {
      console.log(`❌ Discipline non trouvée: ${disciplineName}`)
      console.log('\n📚 Disciplines disponibles:')
      const disciplines = await prisma.discipline.findMany({
        orderBy: { name: 'asc' }
      })
      disciplines.forEach((d) => {
        console.log(`   - ${d.name}`)
      })
      await prisma.$disconnect()
      return
    }
    
    console.log(`✅ Discipline trouvée: ${discipline.name}`)
    
    // Assigner la discipline
    const updatedAuthor = await prisma.user.update({
      where: { id: author.id },
      data: { disciplineId: discipline.id },
      include: { discipline: true }
    })
    
    console.log(`\n✅ Discipline assignée avec succès!`)
    console.log(`   Auteur: ${updatedAuthor.name}`)
    console.log(`   Discipline: ${updatedAuthor.discipline?.name}`)
    console.log(`\n💡 Rafraîchissez la page du dashboard pour voir la discipline s'afficher.`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignDisciplineToAuthor()

