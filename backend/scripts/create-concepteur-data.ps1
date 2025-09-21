# Script PowerShell pour créer les données du concepteur
# Exécuter avec: .\scripts\create-concepteur-data.ps1

Write-Host "🚀 Creating Concepteur data..." -ForegroundColor Green

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Vérifier si Prisma est installé
try {
    $prismaVersion = npx prisma --version
    Write-Host "✅ Prisma CLI available" -ForegroundColor Green
} catch {
    Write-Host "❌ Prisma CLI not found. Installing..." -ForegroundColor Yellow
    npm install prisma @prisma/client
}

# Créer un script temporaire pour créer les données
$tempScript = @"
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createConcepteurData() {
  try {
    console.log('🚀 Creating Concepteur data...')

    // 1. Créer le concepteur
    const hashedPassword = await bcrypt.hash('password123', 10)
    
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

    // 2. Trouver l'auteur existant
    const author = await prisma.user.findUnique({
      where: { email: 'auteur@test.com' }
    })

    if (!author) {
      console.log('❌ Author not found. Run create-author-test-data.ts first.')
      return
    }

    console.log('✅ Author found:', author.name)

    // 3. Trouver les disciplines
    const disciplines = await prisma.discipline.findMany()
    console.log('✅ Disciplines found:', disciplines.length)

    // 4. Créer des œuvres pour le concepteur
    const works = [
      {
        title: 'Mathématiques Appliquées au Gabon',
        isbn: `978-2-${Date.now()}-01`,
        price: 18000,
        disciplineId: disciplines.find(d => d.name === 'Mathématiques')?.id,
        status: 'ON_SALE'
      },
      {
        title: 'Histoire du Gabon Moderne',
        isbn: `978-2-${Date.now()}-02`,
        price: 22000,
        disciplineId: disciplines.find(d => d.name === 'Français')?.id,
        status: 'ON_SALE'
      },
      {
        title: 'Contes et Légendes Gabonaises',
        isbn: `978-2-${Date.now()}-03`,
        price: 15000,
        disciplineId: disciplines.find(d => d.name === 'Français')?.id,
        status: 'ON_SALE'
      },
      {
        title: 'Physique Quantique pour Débutants',
        isbn: `978-2-${Date.now()}-04`,
        price: 25000,
        disciplineId: disciplines.find(d => d.name === 'Physique')?.id,
        status: 'SUBMITTED'
      },
      {
        title: 'Chimie Organique Avancée',
        isbn: `978-2-${Date.now()}-05`,
        price: 28000,
        disciplineId: disciplines.find(d => d.name === 'Chimie')?.id,
        status: 'SUBMITTED'
      },
      {
        title: 'Géographie du Gabon',
        isbn: `978-2-${Date.now()}-06`,
        price: 16000,
        disciplineId: disciplines.find(d => d.name === 'Français')?.id,
        status: 'DRAFT'
      }
    ]

    const createdWorks = []
    for (const workData of works) {
      if (workData.disciplineId) {
        const work = await prisma.work.create({
          data: {
            ...workData,
            concepteurId: concepteur.id,
            authorId: author.id
          }
        })
        createdWorks.push(work)
        console.log(`✅ Work created: ${work.title} (${work.status})`)
      }
    }

    // 5. Créer des commandes pour ces œuvres
    const clients = await Promise.all([
      prisma.user.upsert({
        where: { email: 'client1@test.com' },
        update: {},
        create: {
          name: 'Fatou Sall',
          email: 'client1@test.com',
          password: hashedPassword,
          role: 'CLIENT',
          emailVerified: false
        }
      }),
      prisma.user.upsert({
        where: { email: 'client2@test.com' },
        update: {},
        create: {
          name: 'Moussa Traoré',
          email: 'client2@test.com',
          password: hashedPassword,
          role: 'CLIENT',
          emailVerified: false
        }
      }),
      prisma.user.upsert({
        where: { email: 'client3@test.com' },
        update: {},
        create: {
          name: 'Aïcha Diop',
          email: 'client3@test.com',
          password: hashedPassword,
          role: 'CLIENT',
          emailVerified: false
        }
      })
    ])

    // 6. Créer des commandes
    const orders = []
    
    // Commande 1
    const order1 = await prisma.order.create({
      data: {
        userId: clients[0].id,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order1.id,
        workId: createdWorks[0].id,
        quantity: 2,
        price: createdWorks[0].price
      }
    })
    orders.push(order1)

    // Commande 2
    const order2 = await prisma.order.create({
      data: {
        userId: clients[1].id,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        workId: createdWorks[1].id,
        quantity: 3,
        price: createdWorks[1].price
      }
    })
    orders.push(order2)

    // Commande 3
    const order3 = await prisma.order.create({
      data: {
        userId: clients[2].id,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order3.id,
        workId: createdWorks[2].id,
        quantity: 1,
        price: createdWorks[2].price
      }
    })
    orders.push(order3)

    // Commande 4 - Récente
    const order4 = await prisma.order.create({
      data: {
        userId: clients[0].id,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    })
    
    await prisma.orderItem.create({
      data: {
        orderId: order4.id,
        workId: createdWorks[0].id,
        quantity: 1,
        price: createdWorks[0].price
      }
    })
    orders.push(order4)

    console.log(`✅ Created ${orders.length} orders`)

    // 7. Créer des royalties pour l'auteur
    const royaltyRate = 0.15

    for (const work of createdWorks) {
      const orderItems = await prisma.orderItem.findMany({
        where: { workId: work.id },
        include: { order: true }
      })

      const totalSales = orderItems.reduce((sum, item) => {
        return sum + (item.order.status !== 'CANCELLED' ? item.quantity : 0)
      }, 0)

      if (totalSales > 0) {
        const totalRevenue = orderItems.reduce((sum, item) => {
          return sum + (item.order.status !== 'CANCELLED' ? (item.price * item.quantity) : 0)
        }, 0)

        const totalRoyalty = totalRevenue * royaltyRate

        const royaltyAmount1 = Math.floor(totalRoyalty * 0.7)
        const royaltyAmount2 = totalRoyalty - royaltyAmount1

        await prisma.royalty.create({
          data: {
            userId: author.id,
            workId: work.id,
            amount: royaltyAmount1,
            paid: true,
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
          }
        })

        if (royaltyAmount2 > 0) {
          await prisma.royalty.create({
            data: {
              userId: author.id,
              workId: work.id,
              amount: royaltyAmount2,
              paid: false,
              createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
            }
          })
        }

        console.log(`✅ Royalties created for ${work.title}: ${totalRoyalty.toLocaleString()} FCFA`)
      }
    }

    console.log('\n🎉 Concepteur data creation completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Concepteur: ${concepteur.name}`)
    console.log(`   - Works: ${createdWorks.length}`)
    console.log(`   - Orders: ${orders.length}`)
    console.log(`   - Clients: ${clients.length}`)

  } catch (error) {
    console.error('❌ Error creating concepteur data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createConcepteurData()
"@

# Écrire le script temporaire
$tempScript | Out-File -FilePath "temp-concepteur-script.js" -Encoding UTF8

Write-Host "📝 Running concepteur data creation script..." -ForegroundColor Yellow

# Exécuter le script
try {
    node temp-concepteur-script.js
    Write-Host "✅ Concepteur data created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Error running script: $_" -ForegroundColor Red
} finally {
    # Nettoyer le fichier temporaire
    if (Test-Path "temp-concepteur-script.js") {
        Remove-Item "temp-concepteur-script.js"
        Write-Host "🧹 Temporary file cleaned up" -ForegroundColor Gray
    }
}

Write-Host "`n🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the development server: npm run dev" -ForegroundColor White
Write-Host "2. Login as concepteur: concepteur@test.com / password123" -ForegroundColor White
Write-Host "3. Access dashboard: http://localhost:3000/dashboard/concepteur" -ForegroundColor White


