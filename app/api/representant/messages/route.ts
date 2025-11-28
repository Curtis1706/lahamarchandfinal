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
          senderId: true,
          recipientId: true,
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

      return NextResponse.json({ messages })
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
      const otherUserId = message.senderId === session.user.id 
        ? message.recipient.id 
        : message.sender.id
      
      const otherUserName = message.senderId === session.user.id 
        ? message.recipient.name 
        : message.sender.name

      if (!acc[otherUserId]) {
        acc[otherUserId] = {
          id: otherUserId,
          name: otherUserName,
          lastMessage: message,
          unreadCount: 0,
          messages: []
        }
      }

      acc[otherUserId].messages.push(message)
      if (!message.read && message.recipientId === session.user.id) {
        acc[otherUserId].unreadCount++
      }

      return acc
    }, {} as Record<string, any>)

    const formattedConversations = Object.values(conversations).map((conv: any) => ({
      id: conv.id,
      name: conv.name,
      lastMessage: {
        id: conv.lastMessage.id,
        subject: conv.lastMessage.subject,
        content: conv.lastMessage.content,
        createdAt: conv.lastMessage.createdAt,
        sender: conv.lastMessage.sender
      },
      unreadCount: conv.unreadCount,
      totalMessages: conv.messages.length
    }))

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