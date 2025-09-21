import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testAuthorAuthentication() {
  try {
    console.log('🔐 Testing Author Authentication...')

    // 1. Trouver l'auteur
    const author = await prisma.user.findUnique({
      where: { email: 'auteur@test.com' }
    })

    if (!author) {
      console.log('❌ Author not found')
      return
    }

    console.log('✅ Author found:', author.name)
    console.log('📧 Email:', author.email)
    console.log('🔑 Role:', author.role)

    // 2. Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare('password123', author.password)
    console.log('🔐 Password verification:', passwordMatch ? '✅ Valid' : '❌ Invalid')

    // 3. Simuler une connexion
    console.log('\n🌐 Simulating login...')
    console.log('📝 Login credentials:')
    console.log(`   Email: ${author.email}`)
    console.log(`   Password: password123`)
    console.log(`   Role: ${author.role}`)

    console.log('\n✅ Authentication test completed!')
    console.log('🎯 You can now login with these credentials in the browser:')
    console.log(`   URL: http://localhost:3000/login`)
    console.log(`   Email: ${author.email}`)
    console.log(`   Password: password123`)

  } catch (error) {
    console.error('❌ Error testing authentication:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuthorAuthentication()


