import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRandomPassword, sendCredentialsSMS } from '@/lib/sms';

export const dynamic = 'force-dynamic'

// POST /api/users - Créer un utilisateur (pour le PDG)
export async function POST(request: NextRequest) {

  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est PDG
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès refusé - Seul le PDG peut créer des utilisateurs" }, { status: 403 });
    }

    const body = await request.json();

    const {
      name,
      email,
      phone,
      role,
      disciplineId,
      password
    } = body;


    // Validation des champs obligatoires
    // password est désormais optionnel car il sera généré si absent (cas PDG)
    // Mais ici le PDG peut toujours en fournir un s'il veut, sinon on génère.
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Le nom, l'email et le rôle sont obligatoires" },
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


    // Générer un mot de passe si non fourni
    const finalPassword = password || generateRandomPassword(8);

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(finalPassword, 12);

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
      }
    } catch (notificationError) {
      console.error("⚠️ Erreur création notification:", notificationError);
    }

    // Envoi des identifiants par SMS si un numéro est fourni
    if (user.phone) {
      try {
        await sendCredentialsSMS(user.phone, finalPassword, user.role);
      } catch (smsError) {
        console.error("⚠️ Erreur lors de l'envoi du SMS de bienvenue:", smsError);
      }
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
    } catch (notificationError) {
      console.error("⚠️ Erreur création notification utilisateur:", notificationError);
    }


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

  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est PDG
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès refusé - Seul le PDG peut accéder à cette ressource" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Construire les filtres
    const where: any = {};

    if (role) {
      where.role = role;
    }

    // Par défaut, ne pas retourner les utilisateurs supprimés (INACTIVE + email anonymisé)
    // Sauf si on filtre explicitement par statut
    if (status) {
      where.status = status;
    } else {
      // Si aucun filtre de statut n'est fourni, on exclut les INACTIVE par défaut
      // Car ce sont des utilisateurs "supprimés"
      where.status = { not: 'INACTIVE' };
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

    // Ajouter les headers anti-cache
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    return NextResponse.json({
      users: usersWithoutPasswords,
      total: usersWithoutPasswords.length
    }, { headers });

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

  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est PDG
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès refusé - Seul le PDG peut modifier des utilisateurs" }, { status: 403 });
    }
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

    // Nettoyer disciplineId si vide ou si le rôle ne nécessite pas de discipline
    if (updateData.disciplineId !== undefined) {
      // Si disciplineId est une chaîne vide, le convertir en null
      if (updateData.disciplineId === "" || updateData.disciplineId === null) {
        updateData.disciplineId = null;
      }
      // Si le rôle ne nécessite pas de discipline, forcer à null
      const rolesWithDiscipline = ["AUTEUR", "CONCEPTEUR", "REPRESENTANT"];
      if (updateData.role && !rolesWithDiscipline.includes(updateData.role)) {
        updateData.disciplineId = null;
      }
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

  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est PDG
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès refusé - Seul le PDG peut supprimer des utilisateurs" }, { status: 403 });
    }
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

    // Au lieu de supprimer physiquement, on procède à une anonymisation (Soft Delete)
    // pour conserver l'historique des opérations (commandes, œuvres, etc.)
    await prisma.$transaction(async (tx) => {
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 10000);
      const anonymizedEmail = `deleted-${timestamp}-${randomSuffix}@lahamarchand.com`;

      // 1. Anonymiser l'utilisateur et le désactiver
      await tx.user.update({
        where: { id },
        data: {
          name: "Utilisateur Supprimé", // Nom générique
          email: anonymizedEmail, // Email unique mais invalide
          phone: null, // Supprimer le numéro
          image: null, // Supprimer l'avatar
          password: `deleted-${timestamp}-${randomSuffix}`, // Mot de passe inutilisable (non hashé ou hash bidon)
          status: "INACTIVE", // Désactiver le compte
          emailVerified: null,
          // On garde le rôle pour l'historique (savoir si c'était un auteur, un partenaire, etc.)
          // On garde representantId et disciplineId pour l'historique aussi
        }
      });

      // 2. Supprimer les sessions actives (déconnexion forcée)
      await tx.session.deleteMany({
        where: { userId: id }
      });

      // 3. Supprimer les comptes liés (Google, etc.)
      await tx.account.deleteMany({
        where: { userId: id }
      });

      // 4. Supprimer les notifications (optionnel, pour nettoyer un peu)
      await tx.notification.deleteMany({
        where: { userId: id }
      });

      // NOTE IMPORTANTE:
      // On conserve TOUTES les autres données relationnelles :
      // - Partners
      // - Orders (commandes)
      // - Works (œuvres)
      // - Projects
      // - Withdrawals
      // - Etc.
      // Cela permet de garder l'intégrité comptable et historique.
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur désactivé et anonymisé avec succès. L'historique des opérations a été conservé."
    });

  } catch (error: any) {
    console.error("❌ Erreur suppression utilisateur:", error);

    return NextResponse.json(
      { error: "Erreur lors de la suppression: " + error.message },
      { status: 500 }
    );
  }
}