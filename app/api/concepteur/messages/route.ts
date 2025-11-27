import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

// GET /api/concepteur/messages - Récupérer les messages du concepteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const search = searchParams.get('search')

    // Récupérer les messages reçus
    const receivedMessages = await prisma.message.findMany({
      where: {
        recipientId: session.user.id,
        ...(search ? {
          OR: [
            { subject: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Récupérer les messages envoyés
    const sentMessages = await prisma.message.findMany({
      where: {
        senderId: session.user.id,
        ...(search ? {
          OR: [
            { subject: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Combiner et formater les messages
    let allMessages = [
      ...receivedMessages.map(msg => ({
        id: msg.id,
        subject: msg.subject,
        content: msg.content,
        sender: {
          id: msg.sender.id,
          name: msg.sender.name,
          role: msg.sender.role
        },
        recipient: {
          id: msg.recipient.id,
          name: msg.recipient.name,
          role: msg.recipient.role
        },
        read: msg.read,
        createdAt: format(msg.createdAt, 'dd MMM yyyy, HH:mm', { locale: fr }),
        type: 'received' as const
      })),
      ...sentMessages.map(msg => ({
        id: msg.id,
        subject: msg.subject,
        content: msg.content,
        sender: {
          id: msg.sender.id,
          name: msg.sender.name,
          role: msg.sender.role
        },
        recipient: {
          id: msg.recipient.id,
          name: msg.recipient.name,
          role: msg.recipient.role
        },
        read: true, // Les messages envoyés sont toujours "lus"
        createdAt: format(msg.createdAt, 'dd MMM yyyy, HH:mm', { locale: fr }),
        type: 'sent' as const
      }))
    ]

    // Appliquer le filtre
    if (filter === 'unread') {
      allMessages = allMessages.filter(m => !m.read && m.type === 'received')
    } else if (filter === 'sent') {
      allMessages = allMessages.filter(m => m.type === 'sent')
    } else if (filter === 'received') {
      allMessages = allMessages.filter(m => m.type === 'received')
    }

    // Trier par date (plus récent en premier)
    allMessages.sort((a, b) => {
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })

    const unreadCount = receivedMessages.filter(m => !m.read).length

    return NextResponse.json({
      messages: allMessages,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    )
  }
}

// POST /api/concepteur/messages - Envoyer un message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { recipientId, subject, content, type, priority } = body

    if (!recipientId || !subject || !content) {
      return NextResponse.json({ error: 'Destinataire, sujet et contenu requis' }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId,
        subject: subject.trim(),
        content: content.trim(),
        type: type || 'MESSAGE',
        read: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Message envoyé avec succès',
      messageData: {
        id: message.id,
        subject: message.subject,
        createdAt: format(message.createdAt, 'dd MMM yyyy, HH:mm', { locale: fr })
      }
    })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    )
  }
}

// PUT /api/concepteur/messages - Marquer comme lu
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { messageId, read } = body

    if (!messageId) {
      return NextResponse.json({ error: 'ID du message requis' }, { status: 400 })
    }

    // Vérifier que le message appartient bien au concepteur
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message || message.recipientId !== session.user.id) {
      return NextResponse.json({ error: 'Message introuvable ou accès refusé' }, { status: 404 })
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        read: read !== undefined ? read : true,
        readAt: read !== false ? new Date() : null
      }
    })

    return NextResponse.json({
      message: 'Message mis à jour avec succès',
      messageData: {
        id: updated.id,
        read: updated.read
      }
    })
  } catch (error: any) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du message' },
      { status: 500 }
    )
  }
}

// DELETE /api/concepteur/messages - Supprimer un message
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'CONCEPTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('id')

    if (!messageId) {
      return NextResponse.json({ error: 'ID du message requis' }, { status: 400 })
    }

    // Vérifier que le message appartient bien au concepteur (envoyé ou reçu)
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message || (message.senderId !== session.user.id && message.recipientId !== session.user.id)) {
      return NextResponse.json({ error: 'Message introuvable ou accès refusé' }, { status: 404 })
    }

    await prisma.message.delete({
      where: { id: messageId }
    })

    return NextResponse.json({
      message: 'Message supprimé avec succès'
    })
  } catch (error: any) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du message' },
      { status: 500 }
    )
  }
}

