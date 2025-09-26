import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/notifications - Créer une notification
export async function POST(request: NextRequest) {
  console.log("🔍 API POST /notifications - Création de notification");
  
  try {
    const body = await request.json();
    console.log("🔍 Body reçu:", body);
    
    const { 
      userId, 
      title, 
      message, 
      type, 
      data 
    } = body;
    
    console.log("🔍 Données extraites:", { userId, title, type });

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

    console.log("🔍 Tentative de création avec Prisma...");
    
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

    console.log("✅ Notification créée:", notification);
    
    return NextResponse.json(notification, { status: 201 });
    
  } catch (error: any) {
    console.error("❌ Erreur création notification:", error);
    console.error("❌ Stack:", error.stack);
    
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification: " + error.message },
      { status: 500 }
    );
  }
}

// GET /api/notifications - Récupérer les notifications d'un utilisateur
export async function GET(request: NextRequest) {
  try {
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

    // Compter les notifications non lues
    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        read: false
      }
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Marquer une notification comme lue
export async function PUT(request: NextRequest) {
  try {
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
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Supprimer une notification
export async function DELETE(request: NextRequest) {
  try {
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

    // Supprimer la notification
    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({ message: "Notification supprimée avec succès" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la notification" },
      { status: 500 }
    );
  }
}