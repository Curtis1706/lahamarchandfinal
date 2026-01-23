import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// POST /api/notifications - Créer une notification
export async function POST(request: NextRequest) {
  logger.debug("🔍 API POST /notifications - Création de notification");
  
  try {
    const body = await request.json();
    logger.debug("🔍 Body reçu:", body);
    
    const { 
      userId, 
      title, 
      message, 
      type, 
      data 
    } = body;
    
    logger.debug("🔍 Données extraites:", { userId, title, type });

    // Validation des champs obligatoires
    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: "L'utilisateur, le titre et le message sont obligatoires" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    logger.debug("🔍 Tentative de création avec Prisma...");
    
    // Créer la notification
    const notification = await prisma.notification.create({
      data: {
        userId: userId,
        title: title.trim(),
        message: message.trim(),
        type: type || "GENERAL",
        data: data ? JSON.stringify(data) : null,
        read: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.debug("✅ Notification créée:", notification);
    
    return NextResponse.json(notification, { status: 201 });
    
  } catch (error: any) {
    logger.error("❌ Erreur création notification:", error);
    logger.error("❌ Stack:", error.stack);
    
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification: " + error.message },
      { status: 500 }
    );
  }
}

// GET /api/notifications - Récupérer les notifications d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!userId) {
      return NextResponse.json(
        { error: "ID de l'utilisateur requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur ne peut accéder qu'à ses propres notifications
    // (sauf si c'est le PDG qui peut accéder à toutes les notifications)
    if (session.user.id !== userId && session.user.role !== 'PDG') {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Construire les filtres
    const where: any = {
      userId: userId
    };
    
    if (unreadOnly) {
      where.read = false;
    }

    // Récupérer les notifications
    const notifications = await prisma.notification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Dédupliquer les notifications (grouper les notifications identiques récentes)
    // Une notification est considérée comme dupliquée si elle a le même titre, message, type et userId
    // et a été créée dans les 5 dernières secondes
    const deduplicatedNotifications = notifications.reduce((acc: typeof notifications, notification) => {
      const existingIndex = acc.findIndex((n) => {
        const timeDiff = Math.abs(
          new Date(n.createdAt).getTime() - new Date(notification.createdAt).getTime()
        );
        return (
          n.title === notification.title &&
          n.message === notification.message &&
          n.type === notification.type &&
          n.userId === notification.userId &&
          timeDiff < 5000 // 5 secondes
        );
      });

      if (existingIndex === -1) {
        // Pas de doublon trouvé, ajouter la notification
        acc.push(notification);
      } else {
        // Doublon trouvé, garder la plus récente
        if (new Date(notification.createdAt) > new Date(acc[existingIndex].createdAt)) {
          acc[existingIndex] = notification;
        }
      }

      return acc;
    }, []);

    // Trier à nouveau par date de création (ordre décroissant)
    deduplicatedNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Compter les notifications non lues (après déduplication)
    const unreadCount = deduplicatedNotifications.filter(n => !n.read).length;

    return NextResponse.json({
      notifications: deduplicatedNotifications,
      unreadCount,
      total: deduplicatedNotifications.length
    });
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Marquer une notification comme lue
export async function PUT(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId, read = true } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID de la notification requis" },
        { status: 400 }
      );
    }

    // Vérifier que la notification existe
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notification non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur peut modifier cette notification (propriétaire ou PDG)
    if (existingNotification.userId !== session.user.id && session.user.role !== 'PDG') {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Mettre à jour la notification
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: read
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    logger.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Supprimer une notification
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID de la notification requis" },
        { status: 400 }
      );
    }

    // Vérifier que la notification existe
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notification non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur peut supprimer cette notification (propriétaire ou PDG)
    if (existingNotification.userId !== session.user.id && session.user.role !== 'PDG') {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Supprimer la notification
    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({ message: "Notification supprimée avec succès" });
  } catch (error) {
    logger.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la notification" },
      { status: 500 }
    );
  }
}
