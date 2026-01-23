import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/auteur/messages - Récupérer les messages de l'auteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'AUTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Récupérer les messages d'une conversation spécifique avec le PDG ou autres
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, recipientId: conversationId },
            { senderId: conversationId, recipientId: session.user.id }
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

      // Marquer les messages comme lus
      const unreadMessages = messages.filter(m => !m.read && m.recipientId === session.user.id)
      if (unreadMessages.length > 0) {
        await prisma.message.updateMany({
          where: {
            id: { in: unreadMessages.map(m => m.id) }
          },
          data: {
            read: true,
            readAt: new Date()
          }
        })
      }

      // Formater les messages pour correspondre à l'interface frontend
      const formattedMessages = messages.map(message => ({
        id: message.id,
        subject: message.subject,
        content: message.content,
        sender: message.sender,
        recipient: message.recipient,
        sentAt: message.createdAt.toISOString(),
        readAt: message.readAt?.toISOString(),
        isRead: true, // Tous les messages de la conversation sont maintenant lus
        priority: 'NORMAL' as const,
        type: (message.type || 'GENERAL') as 'INTERNAL' | 'WORK_REVIEW' | 'ORDER_UPDATE' | 'GENERAL'
      }))

      return NextResponse.json({ messages: formattedMessages })
    }

    // Récupérer tous les messages de l'auteur groupés par conversation
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
            type: (message.type || 'GENERAL') as any
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
        type: (message.type || 'GENERAL') as any
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
          type: (message.type || 'GENERAL') as any
        }
      }

      return acc
    }, {} as Record<string, any>)

    const formattedConversations = Object.values(conversations)

    return NextResponse.json(formattedConversations)

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des messages:', error)
    logger.error('Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/auteur/messages - Envoyer un message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'AUTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { recipientId, subject, content, type = 'MESSAGE' } = body

    if (!recipientId || !subject || !content) {
      return NextResponse.json({ 
        error: 'Destinataire, sujet et contenu requis' 
      }, { status: 400 })
    }

    // Vérifier que le destinataire existe et est autorisé (PDG ou représentant)
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, role: true }
    })

    if (!recipient) {
      return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 })
    }

    // Les auteurs ne peuvent envoyer des messages qu'au PDG ou à leur représentant
    if (recipient.role !== 'PDG' && recipient.role !== 'REPRESENTANT') {
      return NextResponse.json({ 
        error: 'Vous ne pouvez envoyer des messages qu\'au PDG ou à votre représentant' 
      }, { status: 403 })
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

    // Créer une notification pour le destinataire
    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: 'Nouveau message',
        message: `Nouveau message de ${message.sender.name}: ${subject}`,
        type: 'MESSAGE',
        read: false
      }
    })

    return NextResponse.json({ message }, { status: 201 })

  } catch (error: any) {
    logger.error('Erreur lors de l\'envoi du message:', error)
    logger.error('Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

