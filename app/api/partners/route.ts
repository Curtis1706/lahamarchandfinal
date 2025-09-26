import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      await prisma.user.update({
        where: { id: existingPartner.userId },
        data: {
          status: status,
          updatedAt: new Date()
        }
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

    // Supprimer le partenaire (cela supprimera aussi l'utilisateur associé via la relation)
    await prisma.partner.delete({
      where: { id }
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: "PARTNER_DELETE",
        userId: existingPartner.userId,
        performedBy: "PDG", // En production, récupérer l'ID du PDG connecté
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

