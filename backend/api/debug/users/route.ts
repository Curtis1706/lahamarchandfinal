import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking users and projects...')
    
    // Vérifier tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    console.log('📋 Found users:', users)
    
    // Chercher un concepteur
    const concepteur = users.find(u => u.role === 'CONCEPTEUR')
    
    if (!concepteur) {
      console.log('❌ No concepteur found, creating one...')
      
      // Créer un concepteur
      const newConcepteur = await prisma.user.create({
        data: {
          name: 'Concepteur Test',
          email: 'concepteur@test.com',
          role: 'CONCEPTEUR',
          emailVerified: new Date()
        }
      })
      
      console.log('✅ Concepteur created:', newConcepteur)
    }
    
    // Vérifier les projets
    const projects = await prisma.project.findMany({
      include: {
        discipline: true,
        concepteur: {
          select: { name: true, email: true }
        }
      }
    })
    
    console.log('📋 Found projects:', projects.length)
    
    return NextResponse.json({
      users,
      projects,
      concepteur: concepteur || 'Created new concepteur',
      message: 'Database check completed'
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


