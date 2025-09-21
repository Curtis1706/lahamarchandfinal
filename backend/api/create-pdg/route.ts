import { NextRequest, NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    // Vérifier la clé secrète pour sécuriser cette API
    const authHeader = request.headers.get('authorization')
    const secretKey = process.env.PDG_CREATION_SECRET || 'dev-secret-key'
    
    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 401 }
      )
    }

    console.log('🏢 Création du compte PDG...')
    
    // Vérifier si un compte PDG existe déjà
    const existingPDG = await prisma.user.findFirst({
      where: { role: Role.PDG }
    })
    
    if (existingPDG) {
      return NextResponse.json({
        message: "Un compte PDG existe déjà",
        email: existingPDG.email,
        name: existingPDG.name,
        loginUrl: "/pdg-login"
      })
    }
    
    // Mot de passe sécurisé
    const password = 'PDG2024!Secure'
    const hashedPassword = await bcryptjs.hash(password, 12)
    
    // Créer le compte PDG
    const pdgUser = await prisma.user.create({
      data: {
        name: 'PDG Administrateur',
        email: 'pdg@lahamarchand.com',
        password: hashedPassword,
        role: Role.PDG,
        emailVerified: new Date()
      }
    })
    
    console.log('✅ Compte PDG créé:', pdgUser.email)
    
    return NextResponse.json({
      message: "Compte PDG créé avec succès",
      email: pdgUser.email,
      name: pdgUser.name,
      password: password,
      id: pdgUser.id,
      loginUrl: "/pdg-login"
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte PDG:', error)
    return NextResponse.json(
      { error: "Erreur lors de la création du compte PDG", details: error.message },
      { status: 500 }
    )
  }
}
