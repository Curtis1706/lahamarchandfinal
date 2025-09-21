const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function fixPdgUser() {
  try {
    console.log('🔧 Fixing missing PDG user...')
    
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    const pdg = await prisma.user.upsert({
      where: { email: 'pdg@lahamarchand.com' },
      update: {},
      create: {
        name: 'PDG Admin',
        email: 'pdg@lahamarchand.com',
        password: hashedPassword,
        role: 'PDG',
        emailVerified: new Date(),
      }
    })
    
    console.log('✅ PDG user created:', pdg.name, pdg.email)
    console.log('🔄 Now refresh the page!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPdgUser()


