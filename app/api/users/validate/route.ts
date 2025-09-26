import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/users/validate - Récupérer les utilisateurs en attente de validation
export async function GET(request: NextRequest) {
  console.log("🔍 API GET /users/validate - Récupération des utilisateurs en attente");
  
  try {
    const users = await prisma.user.findMany({
      where: {
        status: "PENDING"
      },
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
      }
    });

    // Retourner les utilisateurs sans les mots de passe
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    console.log(`✅ ${usersWithoutPasswords.length} utilisateurs en attente récupérés`);
    
    return NextResponse.json({
      users: usersWithoutPasswords,
      total: usersWithoutPasswords.length
    });
    
  } catch (error: any) {
    console.error("❌ Erreur récupération utilisateurs en attente:", error);
    
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs en attente: " + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/users/validate - Valider ou rejeter un utilisateur
export async function PUT(request: NextRequest) {
  console.log("🔍 API PUT /users/validate - Validation d'utilisateur");
  
  try {
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

    console.log(`✅ Utilisateur ${status === "APPROVED" ? "approuvé" : "rejeté"}:`, updatedUser);

    // Créer un log d'audit
    try {
      await prisma.auditLog.create({
        data: {
          action: status === "APPROVED" ? "USER_APPROVED" : "USER_REJECTED",
          userId: userId,
          performedBy: userId, // TODO: Récupérer l'ID du PDG depuis la session
          details: JSON.stringify({
            userId: userId,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
            discipline: user.discipline?.name,
            newStatus: updatedUser.status,
            validationStatus: status
          })
        }
      });
      console.log("✅ Log d'audit créé");
    } catch (auditError) {
      console.error("⚠️ Erreur création log d'audit:", auditError);
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
      console.log("✅ Notification créée pour l'utilisateur");
    } catch (notificationError) {
      console.error("⚠️ Erreur création notification:", notificationError);
    }

    // Retourner sans le mot de passe
    const { password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json({
      success: true,
      message: `Utilisateur ${status === "APPROVED" ? "approuvé" : "rejeté"} avec succès`,
      user: userWithoutPassword
    });
    
  } catch (error: any) {
    console.error("❌ Erreur validation utilisateur:", error);
    
    return NextResponse.json(
      { error: "Erreur lors de la validation: " + error.message },
      { status: 500 }
    );
  }
}