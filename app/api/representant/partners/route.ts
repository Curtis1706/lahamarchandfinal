import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = 'force-dynamic'

// GET /api/representant/partners - Récupérer les partenaires du représentant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Construire les filtres
    const where: any = {
      representantId: session.user.id
    }

    if (status && status !== 'all') {
      where.user = {
        status: status
      }
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contact: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const partners = await prisma.partner.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formater les données
    const formattedPartners = partners.map(partner => {
      return {
        id: partner.id,
        name: partner.name,
        type: partner.type,
        contact: partner.contact,
        email: partner.email,
        phone: partner.phone,
        address: partner.address,
        website: partner.website,
        description: partner.description,
        status: partner.user.status,
        totalOrders: partner._count.orders,
        user: partner.user,
        createdAt: partner.createdAt.toISOString(),
        updatedAt: partner.updatedAt.toISOString()
      }
    })

    return NextResponse.json(formattedPartners)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des partenaires:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/representant/partners - Créer un nouveau partenaire
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      type, 
      contact, 
      email, 
      phone, 
      address, 
      website, 
      description,
      userData 
    } = body

    if (!name || !type || !contact || !userData?.name || !userData?.email) {
      return NextResponse.json({ 
        error: 'Nom, type, contact et données utilisateur requis' 
      }, { status: 400 })
    }

    // Vérifier que l'email utilisateur n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Un utilisateur avec cet email existe déjà' 
      }, { status: 400 })
    }

    // Utiliser le mot de passe fourni par le représentant
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    // Créer l'utilisateur partenaire
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        password: hashedPassword,
        role: 'PARTENAIRE',
        status: 'PENDING', // En attente de validation par le PDG
        emailVerified: null // Pas encore vérifié
      }
    })

    // Créer le partenaire
    const partner = await prisma.partner.create({
      data: {
        name,
        type,
        contact,
        email: email || '',
        phone: phone || '',
        address: address || '',
        website: website || '',
        description: description || '',
        representantId: session.user.id,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        }
      }
    })

    // Créer une notification pour le PDG
    try {
      const pdgUser = await prisma.user.findFirst({
        where: { role: 'PDG' }
      })

      if (pdgUser) {
        await prisma.notification.create({
          data: {
            userId: pdgUser.id,
            title: 'Nouveau partenaire à valider',
            message: `Le représentant ${session.user.name} a créé un nouveau partenaire: ${partner.name}`,
            type: 'PARTNER_CREATED',
            data: { 
              partnerId: partner.id, 
              representantId: session.user.id,
              partnerName: partner.name,
              partnerType: partner.type
            }
          }
        })
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to create notification:', notificationError)
    }

    const response = {
      partner: {
        id: partner.id,
        name: partner.name,
        type: partner.type,
        contact: partner.contact,
        email: partner.email,
        phone: partner.phone,
        address: partner.address,
        website: partner.website,
        description: partner.description,
        status: partner.user.status,
        totalOrders: 0,
        user: partner.user,
        createdAt: partner.createdAt.toISOString()
      },
      credentials: {
        email: userData.email,
        password: userData.password,
        message: "Ces identifiants seront envoyés au partenaire après validation par le PDG"
      }
    }

    console.log('✅ Partner created by representant:', partner.id)

    return NextResponse.json(response, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de la création du partenaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
