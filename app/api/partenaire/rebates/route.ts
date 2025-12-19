/**
 * API Route pour les ristournes des partenaires
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer le partenaire
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "Partenaire non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer toutes les ristournes du partenaire
    const rebates = await prisma.partnerRebate.findMany({
      where: {
        partnerId: partner.id,
      },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
        },
        work: {
          select: {
            title: true,
            author: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculer le solde
    const totalRebates = rebates.reduce((sum, r) => sum + r.amount, 0);
    const totalValidated = rebates
      .filter((r) => r.status === "VALIDATED" || r.status === "PAID")
      .reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = rebates
      .filter((r) => r.status === "PAID")
      .reduce((sum, r) => sum + r.amount, 0);
    
    // Solde disponible = ristournes validées - déjà payées
    const available = totalValidated - totalPaid;

    return NextResponse.json({
      rebates,
      balance: {
        totalRebates,
        totalValidated,
        totalPaid,
        available,
      },
    });
  } catch (error: any) {
    console.error("Error fetching partner rebates:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error.message },
      { status: 500 }
    );
  }
}


