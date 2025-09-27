import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export const dynamic = 'force-dynamic'

// GET /api/representant/authors - Récupérer les auteurs gérés par le représentant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const disciplineId = searchParams.get('disciplineId')

    // Construire les filtres
    const where: any = {
      role: 'AUTEUR',
      // TODO: Ajouter la relation représentant-auteur quand elle sera implémentée
      // representantId: session.user.id
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (disciplineId && disciplineId !== 'all') {
      where.disciplineId = disciplineId
    }

    const authors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            authoredWorks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculer les œuvres en attente pour chaque auteur
    const authorsWithPendingWorks = await Promise.all(
      authors.map(async (author) => {
        const pendingWorksCount = await prisma.work.count({
          where: {
            authorId: author.id,
            status: 'PENDING'
          }
        })

        return {
          id: author.id,
          name: author.name,
          email: author.email,
          phone: author.phone,
          status: author.status,
          discipline: author.discipline,
          worksCount: author._count.authoredWorks,
          pendingWorksCount,
          createdAt: author.createdAt.toISOString(),
          lastActivity: author.createdAt.toISOString() // TODO: Implémenter le suivi de la dernière activité
        }
      })
    )

    return NextResponse.json(authorsWithPendingWorks)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des auteurs:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/representant/authors - Créer un nouvel auteur
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, phone, disciplineId, password } = body

    // Validation des champs obligatoires
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nom, email et mot de passe sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'auteur
    const newAuthor = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        password: hashedPassword,
        role: 'AUTEUR' as Role,
        status: 'ACTIVE', // Les auteurs créés par le représentant sont actifs directement
        disciplineId: disciplineId || null,
        // TODO: Ajouter la relation représentant-auteur
        // representantId: session.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true
      }
    })

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_AUTHOR',
        details: `Auteur créé: ${newAuthor.name} (${newAuthor.email})`,
        metadata: {
          authorId: newAuthor.id,
          authorName: newAuthor.name,
          authorEmail: newAuthor.email
        }
      }
    })

    return NextResponse.json({
      message: 'Auteur créé avec succès',
      author: newAuthor
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de la création de l\'auteur:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
