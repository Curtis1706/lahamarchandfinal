import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// Désactiver le rendu statique pour cette route API
export const dynamic = 'force-dynamic';

// GET /api/auteur/works - Récupérer les œuvres de l'auteur avec statistiques de ventes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'AUTEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Construire la clause WHERE
    const whereClause: any = {
      authorId: session.user.id
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Récupérer les œuvres avec les données nécessaires pour calculer les ventes
    const works = await prisma.work.findMany({
      where: whereClause,
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
          where: { userId: session.user.id },
          select: {
            amount: true,
            paid: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Enrichir chaque œuvre avec les statistiques de ventes
    const enrichedWorks = works.map(work => {
      // Calculer les ventes (quantité totale vendue)
      const sales = work.orderItems.reduce((sum, item) => {
        // Ne compter que les commandes non annulées
        if (item.order && item.order.status !== OrderStatus.CANCELLED) {
          return sum + item.quantity;
        }
        return sum;
      }, 0);

      // Calculer le revenu total (montant total des ventes)
      const revenue = work.orderItems.reduce((sum, item) => {
        // Ne compter que les commandes non annulées
        if (item.order && item.order.status !== OrderStatus.CANCELLED) {
          return sum + (item.price * item.quantity);
        }
        return sum;
      }, 0);

      // Calculer les royalties totales
      const totalRoyalties = work.royalties.reduce((sum, royalty) => sum + royalty.amount, 0);

      // Calculer les royalties payées
      const paidRoyalties = work.royalties
        .filter(royalty => royalty.paid)
        .reduce((sum, royalty) => sum + royalty.amount, 0);

      return {
        id: work.id,
        title: work.title,
        isbn: work.isbn,
        price: work.price,
        status: work.status,
        stock: work.stock,
        description: work.description,
        files: work.files,
        rejectionReason: work.rejectionReason,
        discipline: work.discipline ? {
          id: work.discipline.id,
          name: work.discipline.name
        } : null,
        authorId: work.authorId,
        createdAt: work.createdAt,
        updatedAt: work.updatedAt,
        publishedAt: work.publishedAt,
        // Statistiques de ventes
        sales: {
          quantity: sales,
          revenue: revenue,
          royalties: {
            total: totalRoyalties,
            paid: paidRoyalties,
            pending: totalRoyalties - paidRoyalties
          }
        }
      };
    });

    return NextResponse.json({
      works: enrichedWorks,
      total: enrichedWorks.length
    });

  } catch (error: any) {
    logger.error('Erreur lors de la récupération des œuvres de l\'auteur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des œuvres' },
      { status: 500 }
    );
  }
}

