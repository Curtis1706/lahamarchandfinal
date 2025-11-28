import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/pdg/notifications/chaine - Récupérer les chaînes de notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Construire les conditions de filtre
    const where: any = {}

    if (clientId && clientId !== 'tous-clients') {
      where.clientId = clientId
    }

    if (status && status !== 'tous-statuts') {
      where.status = status === 'actif' ? 'Actif' : 'Désactivé'
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [chains, total] = await Promise.all([
      prisma.notificationChain.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          order: {
            select: {
              id: true,
              status: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { scheduledDate: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.notificationChain.count({ where })
    ])

    return NextResponse.json({
      chains: chains.map(chain => ({
        id: chain.id,
        client: chain.client 
          ? `${chain.client.name} (${chain.client.phone || chain.client.email})`
          : 'Tous les clients',
        titre: chain.title,
        date: format(chain.scheduledDate, 'EEE d MMM yyyy HH:mm', { locale: fr }),
        statut: chain.status,
        creeeLe: format(chain.createdAt, 'EEE d MMM yyyy HH:mm', { locale: fr }),
        creePar: chain.createdBy.email,
        sendSMS: chain.sendSMS,
        sendEmail: chain.sendEmail,
        daysBefore: chain.daysBefore,
        message: chain.message,
        orderId: chain.orderId,
        orderReference: chain.order ? `CMD-${chain.order.id.slice(-8)}` : null
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching notification chains:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des chaînes de notifications',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/pdg/notifications/chaine - Créer une chaîne de notifications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { title, clientId, scheduledDate, scheduledTime, sendSMS, sendEmail, daysBefore, status, message, orderId } = body

    if (!title || !scheduledDate || !message) {
      return NextResponse.json({ error: 'Titre, date et message requis' }, { status: 400 })
    }

    // Combiner date et heure
    const [datePart, timePart] = scheduledDate.split('T')
    const [hours, minutes] = timePart ? timePart.split(':') : ['08', '00']
    const scheduledDateTime = new Date(`${datePart}T${hours}:${minutes}:00`)

    const chain = await prisma.notificationChain.create({
      data: {
        title,
        clientId: clientId && clientId !== 'tous-clients' ? clientId : null,
        scheduledDate: scheduledDateTime,
        sendSMS: sendSMS === 'Oui' || sendSMS === true,
        sendEmail: sendEmail === 'Oui' || sendEmail === true,
        daysBefore: parseInt(daysBefore) || 1,
        status: status || 'Actif',
        message,
        orderId: orderId || null,
        createdById: session.user.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Chaîne de notifications créée avec succès',
      chain: {
        id: chain.id,
        title: chain.title,
        status: chain.status,
        scheduledDate: format(chain.scheduledDate, 'EEE d MMM yyyy HH:mm', { locale: fr })
      }
    })
  } catch (error: any) {
    console.error('Error creating notification chain:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création de la chaîne de notifications' },
      { status: 500 }
    )
  }
}

// PUT /api/pdg/notifications/chaine - Mettre à jour une chaîne
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, clientId, scheduledDate, scheduledTime, sendSMS, sendEmail, daysBefore, status, message, orderId } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    const updateData: any = {}

    if (title) updateData.title = title
    if (clientId !== undefined) updateData.clientId = clientId && clientId !== 'tous-clients' ? clientId : null
    if (scheduledDate) {
      const [datePart, timePart] = scheduledDate.split('T')
      const [hours, minutes] = scheduledTime ? scheduledTime.split(':') : (timePart ? timePart.split(':') : ['08', '00'])
      updateData.scheduledDate = new Date(`${datePart}T${hours}:${minutes}:00`)
    }
    if (sendSMS !== undefined) updateData.sendSMS = sendSMS === 'Oui' || sendSMS === true
    if (sendEmail !== undefined) updateData.sendEmail = sendEmail === 'Oui' || sendEmail === true
    if (daysBefore) updateData.daysBefore = parseInt(daysBefore)
    if (status) updateData.status = status
    if (message) updateData.message = message
    if (orderId !== undefined) updateData.orderId = orderId || null

    const updated = await prisma.notificationChain.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Chaîne de notifications mise à jour avec succès',
      chain: {
        id: updated.id,
        title: updated.title,
        status: updated.status
      }
    })
  } catch (error: any) {
    console.error('Error updating notification chain:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour de la chaîne de notifications' },
      { status: 500 }
    )
  }
}

// DELETE /api/pdg/notifications/chaine - Supprimer une chaîne
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    await prisma.notificationChain.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Chaîne de notifications supprimée avec succès'
    })
  } catch (error: any) {
    console.error('Error deleting notification chain:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression de la chaîne de notifications' },
      { status: 500 }
    )
  }
}

