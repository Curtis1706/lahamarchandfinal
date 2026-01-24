import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPaginationParams, createPaginatedResponse } from '@/lib/pagination';

// GET /api/users/validate - Récupérer les utilisateurs en attente de validation
export async function GET(request: NextRequest) {
  logger.debug("🔍 API GET /users/validate - Récupération des utilisateurs en attente");

  try {
    const { searchParams } = new URL(request.url);
    const { skip, take, page } = getPaginationParams(searchParams);

    const whereConditions = {
      status: "PENDING" as const
    };

    // Compter le total
    const total = await prisma.user.count({ where: whereConditions });

    const users = await prisma.user.findMany({
      where: whereConditions,
      include: {
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take,
      skip
    });

    // Retourner les utilisateurs sans les mots de passe
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    logger.debug(`✅ ${usersWithoutPasswords.length} utilisateurs en attente récupérés (page ${page})`);

    return NextResponse.json(
      createPaginatedResponse(usersWithoutPasswords, total, page, take)
    );

  } catch (error: any) {
    logger.error("❌ Erreur récupération utilisateurs en attente:", error);

    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs en attente: " + error.message },
      { status: 500 }
    );
  }
}

// POST /api/users/validate - Valider ou rejeter un utilisateur (alias pour PUT)
export async function POST(request: NextRequest) {
  return PUT(request)
}

// PUT /api/users/validate - Valider ou rejeter un utilisateur
export async function PUT(request: NextRequest) {
  logger.debug("🔍 API PUT /users/validate - Validation d'utilisateur");

  try {
    // Récupérer la session pour identifier qui effectue la validation
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    if (session.user.role !== 'PDG') {
      return NextResponse.json(
        { error: "Accès refusé - Rôle PDG requis" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: "ID utilisateur et statut requis" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide. Utilisez APPROVED ou REJECTED" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe et est en attente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    if (user.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cet utilisateur n'est pas en attente de validation" },
        { status: 400 }
      );
    }

    // Mettre à jour le statut de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: status === "APPROVED" ? "ACTIVE" : "REJECTED"
      },
      include: {
        discipline: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    logger.debug(`✅ Utilisateur ${status === "APPROVED" ? "approuvé" : "rejeté"}:`, updatedUser);

    // Créer un log d'audit
    try {
      await prisma.auditLog.create({
        data: {
          action: status === "APPROVED" ? "USER_APPROVED" : "USER_REJECTED",
          userId: userId,
          performedBy: session.user.name || session.user.email || 'PDG',
          details: JSON.stringify({
            userId: userId,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
            discipline: user.discipline?.name,
            newStatus: updatedUser.status,
            validationStatus: status,
            performedById: session.user.id,
            performedByName: session.user.name,
            performedAt: new Date().toISOString()
          })
        }
      });
      logger.debug("✅ Log d'audit créé");
    } catch (auditError) {
      logger.error("⚠️ Erreur création log d'audit:", auditError);
    }

    // Créer une notification pour l'utilisateur
    try {
      const notificationTitle = status === "APPROVED"
        ? "Compte approuvé"
        : "Compte refusé";

      const notificationMessage = status === "APPROVED"
        ? `Félicitations ! Votre compte ${user.role.toLowerCase()} a été approuvé par l'administrateur. Vous pouvez maintenant vous connecter.`
        : `Votre demande de compte ${user.role.toLowerCase()} a été refusée par l'administrateur. Contactez l'équipe pour plus d'informations.`;

      const notificationType = status === "APPROVED"
        ? "USER_ACCOUNT_APPROVED"
        : "USER_ACCOUNT_REJECTED";

      await prisma.notification.create({
        data: {
          userId: userId,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          data: JSON.stringify({
            userId: userId,
            userRole: user.role,
            status: updatedUser.status,
            validationStatus: status
          })
        }
      });
      logger.debug("✅ Notification créée pour l'utilisateur");
    } catch (notificationError) {
      logger.error("⚠️ Erreur création notification:", notificationError);
    }

    // Retourner sans le mot de passe
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${status === "APPROVED" ? "approuvé" : "rejeté"} avec succès`,
      user: userWithoutPassword
    });

  } catch (error: any) {
    logger.error("❌ Erreur validation utilisateur:", error);

    return NextResponse.json(
      { error: "Erreur lors de la validation: " + error.message },
      { status: 500 }
    );
  }
}
