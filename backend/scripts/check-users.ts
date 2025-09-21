import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })
    
    console.log('Utilisateurs dans la base de données:')
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Rôle: ${user.role}`)
    })
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()





