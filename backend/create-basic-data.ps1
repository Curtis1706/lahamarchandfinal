# Script PowerShell pour créer les données de base
Write-Host "🚀 Creating basic data..." -ForegroundColor Green

# Créer un script temporaire
$script = @"
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createBasicData() {
  try {
    console.log('🚀 Creating basic data...')

    // 1. Créer les disciplines de base
    const disciplines = [
      'Mathématiques',
      'Français', 
      'Physique',
      'Chimie',
      'Histoire',
      'Géographie',
      'Biologie',
      'Philosophie',
      'Littérature',
      'Sciences'
    ]

    console.log('📚 Creating disciplines...')
    for (const disciplineName of disciplines) {
      await prisma.discipline.upsert({
        where: { name: disciplineName },
        update: {},
        create: { name: disciplineName }
      })
      console.log(\`   ✅ \${disciplineName}\`)
    }

    // 2. Créer l'auteur de test
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const author = await prisma.user.upsert({
      where: { email: 'auteur@test.com' },
      update: {},
      create: {
        name: 'Jean Auteur',
        email: 'auteur@test.com',
        password: hashedPassword,
        role: 'AUTEUR',
        emailVerified: false
      }
    })
    console.log('✅ Author created:', author.name)

    // 3. Créer le concepteur de test
    const concepteur = await prisma.user.upsert({
      where: { email: 'concepteur@test.com' },
      update: {},
      create: {
        name: 'Marie Konaté',
        email: 'concepteur@test.com',
        password: hashedPassword,
        role: 'CONCEPTEUR',
        emailVerified: false
      }
    })
    console.log('✅ Concepteur created:', concepteur.name)

    console.log('\n🎉 Basic data creation completed!')
    console.log(\`📊 Summary:\`)
    console.log(\`   - Disciplines: \${disciplines.length}\`)
    console.log(\`   - Author: \${author.name}\`)
    console.log(\`   - Concepteur: \${concepteur.name}\`)

  } catch (error) {
    console.error('❌ Error creating basic data:', error)
  } finally {
    await prisma.\$disconnect()
  }
}

createBasicData()
"@

# Écrire et exécuter le script
$script | Out-File -FilePath "temp-basic-data.js" -Encoding UTF8

Write-Host "📝 Running basic data creation..." -ForegroundColor Yellow

try {
    node temp-basic-data.js
    Write-Host "✅ Basic data created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
} finally {
    if (Test-Path "temp-basic-data.js") {
        Remove-Item "temp-basic-data.js"
    }
}

Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the development server: npm run dev" -ForegroundColor White
Write-Host "2. Login as concepteur: concepteur@test.com / password123" -ForegroundColor White
Write-Host "3. Try creating a work again" -ForegroundColor White


