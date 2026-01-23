import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/messages - Récupérer les messages d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const type = searchParams.get('type'); // 'sent', 'received', 'all'
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Vérifier les permissions (utilisateur ne peut voir que ses propres messages)
    if (userId !== session.user.id && session.user.role !== "PDG") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Construire les conditions de recherche
    const whereConditions: any = {
      OR: [
        { senderId: userId },
        { recipientId: userId }
      ]
    };

    if (type === 'sent') {
      whereConditions.OR = [{ senderId: userId }];
    } else if (type === 'received') {
      whereConditions.OR = [{ recipientId: userId }];
    }

    if (unreadOnly) {
      whereConditions.AND = [
        { recipientId: userId },
        { read: false }
      ];
    }

    // Récupérer les messages
    const messages = await prisma.message.findMany({
      where: whereConditions,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Ajouter le type de message (sent/received) pour chaque message
    const messagesWithType = messages.map(message => ({
      ...message,
      type: message.senderId === userId ? 'sent' : 'received'
    }));

    logger.debug(`✅ ${messages.length} messages récupérés pour ${session.user.name}`);

    return NextResponse.json({
      messages: messagesWithType,
      total: messages.length,
      unreadCount: messages.filter(m => m.recipientId === userId && !m.read).length
    }, { status: 200 });

  } catch (error: any) {
    logger.error("❌ Erreur lors de la récupération des messages:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages: " + error.message },
      { status: 500 }
    );
  }
}

// POST /api/messages - Envoyer un nouveau message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { recipientId, subject, content, type = "MESSAGE" } = data;

    // Validation des données
    if (!recipientId || !subject?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Destinataire, sujet et contenu requis" },
        { status: 400 }
      );
    }

    // Vérifier que le destinataire existe
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, role: true }
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Destinataire non trouvé" },
        { status: 404 }
      );
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId: recipientId,
        subject: subject.trim(),
        content: content.trim(),
        type: type,
        read: false
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
    });

    // Créer une notification pour le destinataire
    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: "Nouveau message",
        message: `Vous avez reçu un nouveau message de ${session.user.name}: "${subject.trim()}"`,
        type: "NEW_MESSAGE",
        data: JSON.stringify({
          messageId: message.id,
          senderId: session.user.id,
          senderName: session.user.name,
          subject: subject.trim()
        })
      }
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: "MESSAGE_SENT",
        performedBy: session.user.name || "Utilisateur",
        details: `Message envoyé à ${recipient.name}: "${subject.trim()}"`,
        userId: session.user.id
      }
    });

    logger.debug(`✅ Message envoyé de ${session.user.name} vers ${recipient.name}`);

    return NextResponse.json({
      ...message,
      type: 'sent'
    }, { status: 201 });

  } catch (error: any) {
    logger.error("❌ Erreur lors de l'envoi du message:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message: " + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/messages - Mettre à jour un message (marquer comme lu, etc.)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { messageId, read } = data;

    if (!messageId) {
      return NextResponse.json(
        { error: "ID du message requis" },
        { status: 400 }
      );
    }

    // Vérifier que le message existe et que l'utilisateur est le destinataire
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 }
      );
    }

    if (existingMessage.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez modifier que vos propres messages reçus" },
        { status: 403 }
      );
    }

    // Mettre à jour le message
    const updateData: any = {};
    if (typeof read === 'boolean') {
      updateData.read = read;
      if (read) {
        updateData.readAt = new Date();
      }
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: updateData,
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
    });

    logger.debug(`✅ Message ${messageId} mis à jour par ${session.user.name}`);

    return NextResponse.json({
      ...updatedMessage,
      type: updatedMessage.senderId === session.user.id ? 'sent' : 'received'
    }, { status: 200 });

  } catch (error: any) {
    logger.error("❌ Erreur lors de la mise à jour du message:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du message: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/messages - Supprimer un message
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');

    if (!messageId) {
      return NextResponse.json(
        { error: "ID du message requis" },
        { status: 400 }
      );
    }

    // Vérifier que le message existe
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { name: true } },
        recipient: { select: { name: true } }
      }
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions (expéditeur ou destinataire peut supprimer)
    if (existingMessage.senderId !== session.user.id && 
        existingMessage.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez supprimer que vos propres messages" },
        { status: 403 }
      );
    }

    // Supprimer le message
    await prisma.message.delete({
      where: { id: messageId }
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: "MESSAGE_DELETED",
        performedBy: session.user.name || "Utilisateur",
        details: `Message supprimé: "${existingMessage.subject}"`,
        userId: session.user.id
      }
    });

    logger.debug(`✅ Message ${messageId} supprimé par ${session.user.name}`);

    return NextResponse.json(
      { message: "Message supprimé avec succès" },
      { status: 200 }
    );

  } catch (error: any) {
    logger.error("❌ Erreur lors de la suppression du message:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du message: " + error.message },
      { status: 500 }
    );
  }
}
