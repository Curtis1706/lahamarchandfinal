import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// GET /api/auteur/dashboard - Récupérer les données du dashboard auteur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'AUTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const userId = session.user.id;

    // Récupérer les œuvres de l'auteur avec les données nécessaires
    const authorWorks = await prisma.work.findMany({
      where: { authorId: userId },
      include: {
        discipline: {
          select: {
            id: true,
            name: true
          }
        },
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                createdAt: true
              }
            }
          }
        },
        royalties: {
          where: { userId: userId },
          select: {
            amount: true,
            paid: true,
            approved: true,
            createdAt: true
          }
        }
      }
    });

    // Calculer les statistiques générales
    const totalWorks = authorWorks.length;
    const publishedWorks = authorWorks.filter(w => w.status === "PUBLISHED" || w.status === "ON_SALE").length;
    
    // Calculer les ventes totales (quantité d'exemplaires vendus)
    const totalSales = authorWorks.reduce((sum, work) => {
      return sum + work.orderItems.reduce((workSum, item) => {
        // Ne compter que les commandes non annulées
        if (item.order && item.order.status !== OrderStatus.CANCELLED) {
          return workSum + item.quantity;
        }
        return workSum;
      }, 0);
    }, 0);

    // Calculer les royalties totales générées
    const totalRoyaltiesGenerated = authorWorks.reduce((sum, work) => {
      return sum + work.royalties.reduce((royaltySum, royalty) => {
        return royaltySum + royalty.amount;
      }, 0);
    }, 0);

    // Calculer les royalties payées
    const totalRoyaltiesPaid = authorWorks.reduce((sum, work) => {
      return sum + work.royalties.reduce((royaltySum, royalty) => {
        return royaltySum + (royalty.paid ? royalty.amount : 0);
      }, 0);
    }, 0);

    // Calculer les royalties en attente
    const totalRoyaltiesPending = totalRoyaltiesGenerated - totalRoyaltiesPaid;

    // Récupérer les œuvres récentes avec détails
    const recentWorks = authorWorks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(work => {
        const sales = work.orderItems.reduce((sum, item) => {
          return sum + (item.order && item.order.status !== OrderStatus.CANCELLED ? item.quantity : 0);
        }, 0);
        
        const royalties = work.royalties.reduce((sum, royalty) => sum + royalty.amount, 0);
        const royaltiesPaid = work.royalties.reduce((sum, royalty) => sum + (royalty.paid ? royalty.amount : 0), 0);
        
        return {
          id: work.id,
          title: work.title,
          discipline: work.discipline?.name || 'Non définie',
          status: work.status,
          sales,
          royaltiesGenerated: royalties,
          royaltiesPaid,
          royaltiesPending: royalties - royaltiesPaid,
          createdAt: work.createdAt
        };
      });

    // Récupérer les paiements récents
    const recentPayments = await prisma.royalty.findMany({
      where: { userId: userId },
      include: {
        work: {
          select: {
            title: true,
            discipline: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    const formattedPayments = recentPayments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paid: payment.paid,
      createdAt: payment.createdAt.toISOString(),
      workTitle: payment.work.title,
      workDiscipline: payment.work.discipline?.name || 'Non définie',
      status: payment.paid ? 'Payé' : payment.approved ? 'Approuvé' : 'En attente'
    }));

    // Récupérer les notifications récentes
    const notifications = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    const formattedNotifications = notifications.map(notif => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      time: notif.createdAt.toISOString(),
      urgent: notif.type === 'URGENT' || notif.type === 'WORK_REJECTED',
      icon: '📢'
    }));

    return NextResponse.json({
      stats: {
        totalWorks,
        publishedWorks,
        totalSales,
        totalRoyaltiesGenerated,
        totalRoyaltiesPaid,
        totalRoyaltiesPending
      },
      recentWorks,
      recentPayments: formattedPayments,
      notifications: formattedNotifications
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération du dashboard auteur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du dashboard' },
      { status: 500 }
    );
  }
}

