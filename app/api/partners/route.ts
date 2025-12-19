import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Construire les filtres
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
      where.type = type;
    }

    if (status && status !== "ALL") {
      where.user = {
        status: status
      };
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

    // Compter le total pour la pagination
    const total = await prisma.partner.count({ where });

    // Calculer les statistiques
    const stats = await prisma.partner.groupBy({
      by: ["type"],
      _count: {
        id: true
      }
    });

    const typeCounts = stats.reduce((acc, stat) => {
      acc[stat.type] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Calculer les statistiques par statut utilisateur
    const statusStats = await prisma.partner.findMany({
      select: {
        user: {
          select: {
            status: true
          }
        }
      }
    });

    const statusCounts = statusStats.reduce((acc, partner) => {
      const status = partner.user.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculer les performances (commandes des 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const performanceStats = await prisma.partner.findMany({
      include: {
        orders: {
          where: {
            createdAt: {
              gte: thirtyDaysAgo
            }
          },
          include: {
            items: {
              include: {
                work: true
              }
            }
          }
        }
      }
    });

    const performanceData = performanceStats.map(partner => {
      const recentOrders = partner.orders;
      const totalValue = recentOrders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => {
          return itemSum + (item.quantity * item.price);
        }, 0);
      }, 0);

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        ordersCount: recentOrders.length,
        totalValue: totalValue,
        avgOrderValue: recentOrders.length > 0 ? totalValue / recentOrders.length : 0
      };
    });

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
        statuses: statusCounts,
        performance: performanceData
      }
    });
  } catch (error) {
    console.error("Error fetching partners:", error);
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
      userData 
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
    // Si c'est une école, utiliser CLIENT, sinon PARTENAIRE
    const userRole = type === "école" || type === "École" ? "CLIENT" : "PARTENAIRE";

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

    // Créer le partenaire
    const partner = await prisma.partner.create({
      data: {
        name,
        type,
        contact,
        email: email || userData.email || '',
        phone: phone || userData.phone || '',
        address: address || '',
        website: website || '',
        description: description || '',
        representantId: representantId || null,
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

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: 'PARTNER_CREATED',
        userId: user.id,
        performedBy: session.user.id,
        details: JSON.stringify({
          partnerId: partner.id,
          partnerName: partner.name,
          partnerType: partner.type,
          createdBy: session.user.name
        })
      }
    });

    // Créer une notification pour le partenaire/école
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Votre compte a été créé',
        message: `Votre compte ${type === "école" || type === "École" ? "d'école" : "partenaire"} "${name}" a été créé avec succès. Vous pouvez maintenant vous connecter.`,
        type: 'ACCOUNT_CREATED',
        data: JSON.stringify({ 
          partnerId: partner.id,
          partnerType: partner.type
        })
      }
    });

    return NextResponse.json({
      message: `${type === "école" || type === "École" ? "École" : "Partenaire"} créé avec succès`,
      partner
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du partenaire' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, reason, representantId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID du partenaire requis" },
        { status: 400 }
      );
    }

    // Vérifier que le partenaire existe
    const existingPartner = await prisma.partner.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!existingPartner) {
      return NextResponse.json(
        { error: "Partenaire non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour le statut de l'utilisateur associé
    if (status) {
      const updateData: any = {
        status: status,
        updatedAt: new Date()
      }

      // Si le partenaire est validé, activer son compte
      if (status === 'ACTIVE') {
        updateData.emailVerified = new Date()
      }

      await prisma.user.update({
        where: { id: existingPartner.userId },
        data: updateData
      });
    }

    // Mettre à jour le représentant si fourni
    if (representantId !== undefined) {
      await prisma.partner.update({
        where: { id },
        data: {
          representantId: representantId || null
        }
      });
    }

    // Récupérer le partenaire mis à jour
    const updatedPartner = await prisma.partner.findUnique({
      where: { id },
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

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: `PARTNER_STATUS_CHANGE_${status || 'UPDATE'}`,
        userId: existingPartner.userId,
        performedBy: "PDG", // En production, récupérer l'ID du PDG connecté
        details: JSON.stringify({
          partnerId: id,
          partnerName: existingPartner.name,
          oldStatus: existingPartner.user.status,
          newStatus: status,
          reason: reason || "Modification par le PDG",
          representantId
        })
      }
    });

    // Créer une notification pour le partenaire
    if (status && status !== existingPartner.user.status) {
      await prisma.notification.create({
        data: {
          userId: existingPartner.userId,
          title: "Statut de votre compte partenaire modifié",
          message: `Le statut de votre compte partenaire "${existingPartner.name}" a été modifié en "${status}". ${reason ? `Raison: ${reason}` : ""}`,
          type: "PARTNER_STATUS_UPDATE",
          data: JSON.stringify({
            partnerId: id,
            newStatus: status,
            reason
          })
        }
      });
    }

    return NextResponse.json(updatedPartner);
  } catch (error) {
    console.error("Error updating partner:", error);
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

    // Vérifier que le partenaire existe
    const existingPartner = await prisma.partner.findUnique({
      where: { id },
      include: {
        user: true,
        orders: true
      }
    });

    if (!existingPartner) {
      return NextResponse.json(
        { error: "Partenaire non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les contraintes d'intégrité
    if (existingPartner.orders.length > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer ce partenaire car il a des commandes associées" },
        { status: 400 }
      );
    }

    // Supprimer le partenaire et l'utilisateur associé dans une transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer d'abord le partenaire
      await tx.partner.delete({
        where: { id }
      });

      // Supprimer l'utilisateur associé (si c'est une école/client, on peut supprimer)
      // Vérifier qu'il n'y a pas d'orders directement liées à cet utilisateur
      const userOrders = await tx.order.count({
        where: { userId: existingPartner.userId }
      });

      if (userOrders === 0) {
        await tx.user.delete({
          where: { id: existingPartner.userId }
        });
      }
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: "PARTNER_DELETE",
        userId: existingPartner.userId,
        performedBy: session.user.id,
        details: JSON.stringify({
          partnerId: id,
          partnerName: existingPartner.name,
          reason: "Suppression par le PDG"
        })
      }
    });

    return NextResponse.json({ message: "Partenaire supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du partenaire" },
      { status: 500 }
    );
  }
}

