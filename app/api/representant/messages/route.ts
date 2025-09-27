import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET /api/representant/messages - Récupérer les conversations du représentant
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
          ],
          conversationId: conversationId
        },
        select: {
          id: true,
          subject: true,
          content: true,
          sentAt: true,
          readAt: true,
          priority: true,
          type: true,
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
          sentAt: 'asc'
      }
      })

      return NextResponse.json(messages)
    } else {
      // Récupérer les conversations
      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: session.user.id
            }
          }
        },
        select: {
          id: true,
          participants: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          },
          messages: {
            select: {
              id: true,
              subject: true,
              content: true,
              sentAt: true,
              readAt: true,
              priority: true,
              type: true,
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            },
            orderBy: {
              sentAt: 'desc'
            },
            take: 1
          },
          _count: {
            select: {
              messages: {
                where: {
                  recipientId: session.user.id,
                  readAt: null
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })

      // Transformer les données pour correspondre à l'interface
      const formattedConversations = conversations.map(conv => {
        const otherParticipant = conv.participants.find(p => p.user.id !== session.user.id)?.user
        const lastMessage = conv.messages[0]

        return {
          id: conv.id,
          participant: otherParticipant,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            subject: lastMessage.subject,
            content: lastMessage.content,
            sender: lastMessage.sender,
            recipient: {
              id: session.user.id,
              name: session.user.name || '',
              email: session.user.email || '',
              role: session.user.role || ''
            },
            sentAt: lastMessage.sentAt.toISOString(),
            readAt: lastMessage.readAt?.toISOString(),
            isRead: !!lastMessage.readAt,
            priority: lastMessage.priority,
            type: lastMessage.type
          } : null,
          unreadCount: conv._count.messages,
          messages: []
        }
      }).filter(conv => conv.participant && conv.lastMessage)

      return NextResponse.json(formattedConversations)
    }

  } catch (error: any) {
    console.error('Erreur lors de la récupération des messages:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/representant/messages - Envoyer un nouveau message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'REPRESENTANT') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { recipientId, subject, content, priority = 'NORMAL', type = 'GENERAL', conversationId } = body

    if (!recipientId || !subject || !content) {
      return NextResponse.json(
        { error: 'Destinataire, sujet et contenu sont obligatoires' },
        { status: 400 }
      )
    }

    let finalConversationId = conversationId

    // Si pas de conversationId, créer ou trouver une conversation
    if (!finalConversationId) {
      let conversation = await prisma.conversation.findFirst({
        where: {
          participants: {
            every: {
              userId: {
                in: [session.user.id, recipientId]
              }
            }
          }
        }
      })

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            participants: {
              create: [
                { userId: session.user.id },
                { userId: recipientId }
              ]
            }
          }
        })
      }

      finalConversationId = conversation.id
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversationId: finalConversationId,
        senderId: session.user.id,
        recipientId: recipientId,
        subject: subject.trim(),
        content: content.trim(),
        priority: priority as 'LOW' | 'NORMAL' | 'HIGH',
        type: type as 'INTERNAL' | 'WORK_REVIEW' | 'ORDER_UPDATE' | 'GENERAL',
        sentAt: new Date()
      },
      select: {
        id: true,
        subject: true,
        content: true,
        sentAt: true,
        priority: true,
        type: true,
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

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: finalConversationId },
      data: { updatedAt: new Date() }
    })

    // Créer une notification pour le destinataire
    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: 'Nouveau message',
        message: `Vous avez reçu un nouveau message de ${session.user.name}: ${subject}`,
        type: 'MESSAGE',
        isRead: false,
        metadata: {
          messageId: message.id,
          conversationId: finalConversationId,
          senderId: session.user.id
        }
      }
    })

    return NextResponse.json({
      message: 'Message envoyé avec succès',
      message: message
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erreur lors de l\'envoi du message:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
