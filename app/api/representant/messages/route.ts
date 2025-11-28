import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/representant/messages - Récupérer les messages du représentant
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Récupérer les messages d'une conversation spécifique
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id },
            { recipientId: session.user.id }
          ]
        },
        select: {
          id: true,
          subject: true,
          content: true,
          type: true,
          read: true,
          readAt: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      // Formater les messages pour correspondre à l'interface frontend
      const formattedMessages = messages.map(message => ({
        id: message.id,
        subject: message.subject,
        content: message.content,
        sender: message.sender,
        recipient: message.recipient,
        sentAt: message.createdAt.toISOString(),
        readAt: message.readAt?.toISOString(),
        isRead: message.read,
        priority: 'NORMAL' as const,
        type: (message.type || 'GENERAL') as 'INTERNAL' | 'WORK_REVIEW' | 'ORDER_UPDATE' | 'GENERAL'
      }))

      return NextResponse.json({ messages: formattedMessages })
    }

    // Récupérer les messages du représentant
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { recipientId: session.user.id }
        ]
      },
      select: {
        id: true,
        subject: true,
        content: true,
        type: true,
        read: true,
        readAt: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Grouper les messages par correspondant pour simuler des conversations
    const conversations = messages.reduce((acc, message) => {
      const isSentByUser = message.sender.id === session.user.id
      const otherUser = isSentByUser ? message.recipient : message.sender
      const otherUserId = otherUser.id

      if (!acc[otherUserId]) {
        acc[otherUserId] = {
          id: otherUserId,
          participant: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            role: otherUser.role
          },
          lastMessage: {
            id: message.id,
            subject: message.subject,
            content: message.content,
            sender: message.sender,
            recipient: message.recipient,
            sentAt: message.createdAt.toISOString(),
            readAt: message.readAt?.toISOString(),
            isRead: message.read,
            priority: 'NORMAL' as const,
            type: message.type as any
          },
          unreadCount: 0,
          messages: []
        }
      }

      acc[otherUserId].messages.push({
        id: message.id,
        subject: message.subject,
        content: message.content,
        sender: message.sender,
        recipient: message.recipient,
        sentAt: message.createdAt.toISOString(),
        readAt: message.readAt?.toISOString(),
        isRead: message.read,
        priority: 'NORMAL' as const,
        type: message.type as any
      })

      if (!message.read && !isSentByUser) {
        acc[otherUserId].unreadCount++
      }

      // Mettre à jour le dernier message si nécessaire
      if (new Date(message.createdAt) > new Date(acc[otherUserId].lastMessage.sentAt)) {
        acc[otherUserId].lastMessage = {
          id: message.id,
          subject: message.subject,
          content: message.content,
          sender: message.sender,
          recipient: message.recipient,
          sentAt: message.createdAt.toISOString(),
          readAt: message.readAt?.toISOString(),
          isRead: message.read,
          priority: 'NORMAL' as const,
          type: message.type as any
        }
      }

      return acc
    }, {} as Record<string, any>)

    const formattedConversations = Object.values(conversations)

    return NextResponse.json(formattedConversations)

  } catch (error: any) {
    console.error('Erreur lors de la récupération des messages:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/representant/messages - Envoyer un message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { recipientId, subject, content, type = 'MESSAGE' } = body

    if (!recipientId || !subject || !content) {
      return NextResponse.json({ 
        error: 'Destinataire, sujet et contenu requis' 
      }, { status: 400 })
    }

    // Vérifier que le destinataire existe
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    })

    if (!recipient) {
      return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 })
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        subject,
        content,
        type,
        senderId: session.user.id,
        recipientId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ message }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du message:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}