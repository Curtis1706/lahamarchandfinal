import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient();

// POST /api/users - Créer un utilisateur (pour le PDG)
export async function POST(request: NextRequest) {
  console.log("🔍 API POST /users - Création d'utilisateur");
  
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("❌ Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est PDG
    if (session.user.role !== 'PDG') {
      console.log("❌ Accès refusé - Rôle:", session.user.role);
      return NextResponse.json({ error: "Accès refusé - Seul le PDG peut créer des utilisateurs" }, { status: 403 });
    }

    console.log("✅ PDG authentifié:", session.user.email, "Création d'utilisateur autorisée");
    const body = await request.json();
    console.log("🔍 Body reçu:", body);
    
    const { 
      name, 
      email, 
      phone, 
      role, 
      disciplineId, 
      password 
    } = body;

    console.log("🔍 Données extraites:", { name, email, phone, role, disciplineId });

    // Validation des champs obligatoires
    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: "Le nom, l'email, le rôle et le mot de passe sont obligatoires" },
        { status: 400 }
      );
    }

    // Validation du rôle - Le PDG peut créer tous les rôles
    const validRoles = ["PDG", "AUTEUR", "CONCEPTEUR", "PARTENAIRE", "REPRESENTANT", "CLIENT", "INVITE"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide. Rôles valides: " + validRoles.join(", ") },
        { status: 400 }
      );
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Vérifier que le téléphone n'existe pas déjà (si fourni)
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone }
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: "Un utilisateur avec ce numéro de téléphone existe déjà" },
          { status: 400 }
        );
      }
    }

    // Vérifier que la discipline existe si fournie
    if (disciplineId) {
      const discipline = await prisma.discipline.findUnique({
        where: { id: disciplineId }
      });

      if (!discipline) {
        return NextResponse.json(
          { error: "Discipline non trouvée" },
          { status: 400 }
        );
      }
    }

    console.log("🔍 Tentative de création avec Prisma...");

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    // Pour les comptes invités, le statut est ACTIVE mais avec des permissions limitées
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null, // Téléphone optionnel pour les invités
        password: hashedPassword,
        role: role,
        status: "ACTIVE", // Actif directement car créé par le PDG
        discipline: disciplineId ? {
          connect: { id: disciplineId }
        } : undefined,
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

    console.log("✅ Utilisateur créé, ajout des logs et notifications...");

    // Créer un log d'audit
    try {
      await prisma.auditLog.create({
        data: {
          action: "USER_CREATE",
          userId: user.id,
          performedBy: session.user.id, // Créé par le PDG
          details: `Utilisateur ${user.name} (${user.role}) créé par le PDG ${session.user.name}`,
          metadata: JSON.stringify({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
            discipline: user.discipline?.name,
            status: "ACTIVE",
            createdBy: session.user.name,
            createdByEmail: session.user.email
          })
        }
      });
      console.log("✅ Log d'audit créé");
    } catch (auditError) {
      console.error("⚠️ Erreur création log d'audit:", auditError);
    }

    // Créer une notification pour le PDG (utilisateur créé directement)
    try {
      const pdgUser = await prisma.user.findFirst({
        where: { role: "PDG" }
      });

      if (pdgUser) {
        await prisma.notification.create({
          data: {
            userId: pdgUser.id,
            title: "Nouvel utilisateur créé",
            message: `Un nouveau compte ${role.toLowerCase()} a été créé par le PDG: ${user.name} (${user.email}).`,
            type: "USER_CREATED",
            data: JSON.stringify({
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              userRole: user.role,
              discipline: user.discipline?.name
            })
          }
        });
        console.log("✅ Notification créée pour le PDG");
      }
    } catch (notificationError) {
      console.error("⚠️ Erreur création notification:", notificationError);
    }

    // Créer une notification pour l'utilisateur
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Compte créé avec succès",
          message: `Votre compte ${role.toLowerCase()} a été créé par l'administrateur et est maintenant actif.`,
          type: "USER_ACCOUNT_CREATED",
          data: JSON.stringify({
            userId: user.id,
            userRole: user.role,
            status: "ACTIVE"
          })
        }
      });
      console.log("✅ Notification créée pour l'utilisateur");
    } catch (notificationError) {
      console.error("⚠️ Erreur création notification utilisateur:", notificationError);
    }

    console.log("✅ Utilisateur créé avec succès:", user);
    
    // Retourner les données sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;
    
    // Préparer la réponse
    const responseData: any = {
      success: true,
      message: "Compte créé avec succès. Il est en attente de validation par l'administrateur.",
      user: userWithoutPassword
    };
    
    return NextResponse.json(responseData, { status: 201 });
    
  } catch (error: any) {
    console.error("❌ Erreur création utilisateur:", error);
    console.error("❌ Stack:", error.stack);
    
    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email ou ce téléphone existe déjà" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Erreur lors de la création du compte: " + error.message },
      { status: 500 }
    );
  }
}

// GET /api/users - Récupérer les utilisateurs (pour le PDG)
export async function GET(request: NextRequest) {
  console.log("🔍 API GET /users - Récupération des utilisateurs");
  
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("❌ Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est PDG
    if (session.user.role !== 'PDG') {
      console.log("❌ Accès refusé - Rôle:", session.user.role);
      return NextResponse.json({ error: "Accès refusé - Seul le PDG peut accéder à cette ressource" }, { status: 403 });
    }

    console.log("✅ Utilisateur authentifié:", session.user.email, "Rôle:", session.user.role);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Construire les filtres
    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
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

    console.log(`✅ ${usersWithoutPasswords.length} utilisateurs récupérés`);
    
    return NextResponse.json({
      users: usersWithoutPasswords,
      total: usersWithoutPasswords.length
    });
    
  } catch (error: any) {
    console.error("❌ Erreur récupération utilisateurs:", error);
    
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs: " + error.message },
      { status: 500 }
    );
  }
}

// PUT /api/users - Mettre à jour un utilisateur
export async function PUT(request: NextRequest) {
  console.log("🔍 API PUT /users - Mise à jour d'utilisateur");
  
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Hasher le mot de passe si fourni
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        discipline: {
      select: {
        id: true,
            name: true
          }
        }
      }
    });

    console.log("✅ Utilisateur mis à jour:", updatedUser);

    // Retourner sans le mot de passe
    const { password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });
    
  } catch (error: any) {
    console.error("❌ Erreur mise à jour utilisateur:", error);
    
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Supprimer un utilisateur
export async function DELETE(request: NextRequest) {
  console.log("🔍 API DELETE /users - Suppression d'utilisateur");
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id }
    });

    console.log("✅ Utilisateur supprimé:", id);
    
    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé avec succès"
    });
    
  } catch (error: any) {
    console.error("❌ Erreur suppression utilisateur:", error);
    
    return NextResponse.json(
      { error: "Erreur lors de la suppression: " + error.message },
      { status: 500 }
    );
  }
}