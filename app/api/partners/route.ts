import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { sendCredentialsSMS } from "@/lib/sms";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const isSchoolAll = type === "école_all";

    if (isSchoolAll) {
      // Logique spécifique pour les écoles (Table Client)
      const where: any = {
        type: { in: ["ecole_contractuelle", "ecole_non_contractuelle"] }
      };

      if (search) {
        where.OR = [
          { nom: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { contact: { contains: search, mode: "insensitive" } }
        ];
      }

      if (status && status !== "ALL") {
        where.users = { some: { status: status } };
      }

      const [clients, total] = await Promise.all([
        (prisma.client as any).findMany({
          where,
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true,
                role: true,
                createdAt: true,
                _count: { select: { orders: true } }
              }
            }
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit
        }),
        prisma.client.count({ where })
      ]);

      const partners = clients.map((client: any) => ({
        id: client.id,
        name: client.nom,
        type: client.type,
        email: client.email,
        phone: client.telephone,
        address: client.address,
        contact: client.contact,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        user: client.users?.[0] || null,
        _count: {
          orders: client.users?.[0]?._count.orders || 0
        }
      }));

      // Calculer des stats simples pour les écoles
      const stats = await prisma.client.groupBy({
        where: { type: { in: ["ecole_contractuelle", "ecole_non_contractuelle"] } },
        by: ["type"],
        _count: { id: true }
      });

      const typeCounts = stats.reduce((acc, stat) => {
        acc[stat.type] = stat._count.id;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        partners,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          types: typeCounts,
          statuses: {},
          performance: []
        }
      });
    }

    // --- Logique standard pour les Partenaires (Table Partner) ---
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { contact: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    if (type && type !== "ALL") {
      // On exclut les types écoles de la liste des partenaires standards
      where.type = type;
    }

    if (status && status !== "ALL") {
      where.user = { status };
    }

    // Récupérer les partenaires avec les relations
    const partners = await prisma.partner.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            role: true,
            createdAt: true
          }
        },
        representant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      skip,
      take: limit
    });

    const total = await prisma.partner.count({ where });

    // Calculer les statistiques partenaires
    const stats = await prisma.partner.groupBy({
      by: ["type"],
      _count: { id: true }
    });

    const typeCounts = stats.reduce((acc, stat) => {
      acc[stat.type] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      partners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        types: typeCounts,
        statuses: {},
        performance: []
      }
    });
  } catch (error) {
    logger.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des partenaires" },
      { status: 500 }
    );
  }
}

// POST /api/partners - Créer un nouveau partenaire (PDG uniquement)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      type,
      contact,
      email,
      phone,
      address,
      website,
      description,
      representantId,
      userData,
      sendSms
    } = body;

    if (!name || !type || !contact || !userData?.name || !userData?.email || !userData?.password) {
      return NextResponse.json({
        error: 'Nom, type, contact et données utilisateur (nom, email, mot de passe) requis'
      }, { status: 400 });
    }

    // Vérifier que l'email utilisateur n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return NextResponse.json({
        error: 'Un utilisateur avec cet email existe déjà'
      }, { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Déterminer le rôle selon le type
    // Si c'est une école (contractuelle ou non), utiliser CLIENT, sinon PARTENAIRE
    const userRole = (type === "école" || type === "École" || type === "ecole_contractuelle" || type === "ecole_non_contractuelle") ? "CLIENT" : "PARTENAIRE";

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        password: hashedPassword,
        role: userRole,
        status: 'ACTIVE', // Le PDG peut créer directement en ACTIVE
        emailVerified: new Date()
      }
    });

    const isSchool = type.toLowerCase().includes("ecole") || type.toLowerCase().includes("école");

    let partnerOrClient;
    if (isSchool) {
      // Créer le client pour l'école
      partnerOrClient = await (prisma.client as any).create({
        data: {
          nom: name,
          type: type as any, // Cast vers l'enum ClientType
          contact,
          email: email || userData.email || '',
          telephone: phone || userData.phone || '',
          address: address || '',
          representantId: representantId && representantId !== "none" ? representantId : null,
          users: {
            connect: { id: user.id }
          }
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              role: true,
              createdAt: true
            }
          },
          department: true
        }
      });
    } else {
      // Créer le partenaire standard
      partnerOrClient = await prisma.partner.create({
        data: {
          name,
          type,
          contact,
          email: email || userData.email || '',
          phone: phone || userData.phone || '',
          address: address || '',
          website: website || '',
          description: description || '',
          representantId: representantId && representantId !== "none" ? representantId : null,
          userId: user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              role: true,
              createdAt: true
            }
          },
          representant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          _count: {
            select: {
              orders: true
            }
          }
        }
      });
    }

    // Créer une notification pour l'utilisateur
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Votre compte a été créé',
        message: `Votre compte ${isSchool ? "d'école" : "partenaire"} "${name}" a été créé avec succès. Vous pouvez maintenant vous connecter.`,
        type: 'ACCOUNT_CREATED',
        data: JSON.stringify({
          id: partnerOrClient.id,
          type: isSchool ? 'CLIENT' : 'PARTNER'
        })
      }
    });

    // Envoyer le SMS si demandé
    if (sendSms && userData.phone) {
      try {
        logger.info(`Sending credentials SMS to ${userData.phone} for school ${name}`);
        await sendCredentialsSMS(
          userData.phone,
          userData.password,
          'CLIENT',
          type
        );
      } catch (smsError) {
        logger.error('Error sending credentials SMS:', smsError);
      }
    }

    return NextResponse.json({
      message: `${isSchool ? "École" : "Partenaire"} créé avec succès`,
      partner: isSchool ? {
        ...partnerOrClient,
        name: (partnerOrClient as any).nom,
        phone: (partnerOrClient as any).telephone,
        user: (partnerOrClient as any).users?.[0]
      } : partnerOrClient
    }, { status: 201 });

  } catch (error: any) {
    logger.error('Error creating partner:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du partenaire' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Seul le PDG peut modifier les partenaires
    if (session.user.role !== 'PDG') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json();
    const {
      id,
      status,
      reason,
      representantId,
      name,
      type,
      contact,
      email,
      phone,
      address,
      website,
      description
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID du partenaire requis" },
        { status: 400 }
      );
    }

    // Vérifier si c'est un partenaire ou un client (école)
    let existingItem: any = await prisma.partner.findUnique({
      where: { id },
      include: { user: true }
    });

    let isClient = false;
    if (!existingItem) {
      existingItem = await (prisma.client as any).findUnique({
        where: { id },
        include: { users: { take: 1 } }
      });
      if (existingItem) {
        isClient = true;
        existingItem.user = existingItem.users?.[0]; // Normalisation pour la logique suivante
      }
    }

    if (!existingItem) {
      return NextResponse.json(
        { error: "Partenaire ou École non trouvé" },
        { status: 404 }
      );
    }

    const userId = isClient ? existingItem.user?.id : existingItem.userId;
    if (!userId && status) {
      return NextResponse.json({ error: "Utilisateur non associé" }, { status: 400 });
    }

    if (status && userId) {
      const updateData: any = {
        status: status,
        updatedAt: new Date()
      }

      if (status === 'ACTIVE') {
        updateData.emailVerified = new Date()
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    }

    // Mettre à jour les informations (Mapping si Client)
    const updateData: any = {};
    if (name !== undefined) {
      if (isClient) updateData.nom = name;
      else updateData.name = name;
    }
    if (type !== undefined) updateData.type = type;
    if (contact !== undefined) updateData.contact = contact;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) {
      if (isClient) updateData.telephone = phone;
      else updateData.phone = phone;
    }
    if (address !== undefined) updateData.address = address;
    if (website !== undefined && !isClient) updateData.website = website;
    if (description !== undefined && !isClient) updateData.description = description;
    if (representantId !== undefined) {
      updateData.representantId = representantId && representantId !== "none" ? representantId : null;
    }

    if (Object.keys(updateData).length > 0) {
      if (isClient) {
        await (prisma.client as any).update({ where: { id }, data: updateData });
      } else {
        await prisma.partner.update({ where: { id }, data: updateData });
      }
    }

    // Récupérer l'entité mise à jour
    let updatedEntity: any;
    if (isClient) {
      const client = await (prisma.client as any).findUnique({
        where: { id },
        include: {
          users: {
            select: { id: true, name: true, email: true, phone: true, status: true, role: true, createdAt: true, _count: { select: { orders: true } } }
          }
        }
      });
      updatedEntity = client ? {
        ...client,
        name: client.nom,
        phone: client.telephone,
        user: client.users?.[0],
        _count: { orders: client.users?.[0]?._count.orders || 0 }
      } : null;
    } else {
      updatedEntity = await prisma.partner.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, status: true, role: true, createdAt: true } },
          representant: { select: { id: true, name: true, email: true, phone: true } },
          _count: { select: { orders: true } }
        }
      });
    }

    // Créer une notification
    if (status && userId && status !== existingItem.user?.status) {
      await prisma.notification.create({
        data: {
          userId: userId,
          title: `Statut de votre compte ${isClient ? "d'école" : "partenaire"} modifié`,
          message: `Le statut de votre compte "${isClient ? existingItem.nom : existingItem.name}" a été modifié en "${status}". ${reason ? `Raison: ${reason}` : ""}`,
          type: isClient ? "CLIENT_STATUS_UPDATE" : "PARTNER_STATUS_UPDATE",
          data: JSON.stringify({
            id: id,
            newStatus: status,
            reason
          })
        }
      });
    }

    return NextResponse.json(updatedEntity);
  } catch (error) {
    logger.error("Error updating partner:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du partenaire" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'PDG') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID du partenaire requis" },
        { status: 400 }
      );
    }

    // Vérifier si c'est un partenaire ou un client (école)
    let existingItem: any = await prisma.partner.findUnique({
      where: { id },
      include: { user: true, orders: true }
    });

    let isClient = false;
    if (!existingItem) {
      existingItem = await (prisma.client as any).findUnique({
        where: { id },
        include: {
          users: { include: { _count: { select: { orders: true } } } }
        }
      });
      if (existingItem) {
        isClient = true;
        existingItem.user = existingItem.users?.[0];
        existingItem.ordersCount = existingItem.user?._count.orders || 0;
      }
    }

    if (!existingItem) {
      return NextResponse.json(
        { error: "Partenaire ou École non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les contraintes (commandes)
    const hasOrders = isClient ? existingItem.ordersCount > 0 : existingItem.orders.length > 0;
    if (hasOrders) {
      return NextResponse.json(
        { error: "Impossible de supprimer car des commandes sont associées" },
        { status: 400 }
      );
    }

    const userId = isClient ? existingItem.user?.id : existingItem.userId;

    // Supprimer dans une transaction
    await prisma.$transaction(async (tx) => {
      if (isClient) {
        // Pour un client, on retire juste le lien avec l'utilisateur ou on supprime le client
        await (tx.client as any).delete({ where: { id } });
      } else {
        // Nettoyer les données liées au partenaire
        await tx.partnerStock.deleteMany({ where: { partnerId: id } });
        await tx.partnerRebate.deleteMany({ where: { partnerId: id } });
        await tx.rebateRate.deleteMany({ where: { partnerId: id } });
        await tx.partner.delete({ where: { id } });
      }

      if (userId) {
        const userOrders = await tx.order.count({ where: { userId } });
        if (userOrders === 0) {
          await tx.notification.deleteMany({ where: { userId } });
          await tx.session.deleteMany({ where: { userId } });
          await tx.account.deleteMany({ where: { userId } });
          await tx.user.delete({ where: { id: userId } });
        }
      }
    });

    return NextResponse.json({ message: "École supprimée avec succès" });
  } catch (error) {
    logger.error("Error deleting partner:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du partenaire" },
      { status: 500 }
    );
  }
}

