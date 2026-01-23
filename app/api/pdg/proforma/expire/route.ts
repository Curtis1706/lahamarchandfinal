import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/pdg/proforma/expire - Marquer automatiquement les proformas expirés
// Cette route peut être appelée par un cron job externe ou un scheduler
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel : peut être appelé par un cron job avec une clé secrète)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Si un secret est configuré, vérifier qu'il correspond
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Sinon, vérifier la session normale
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== "PDG") {
        return NextResponse.json(
          { error: "Accès non autorisé" },
          { status: 403 }
        );
      }
    }

    const now = new Date();

    // Trouver tous les proformas SENT avec validUntil dépassée
    const expiredProformas = await prisma.proforma.findMany({
      where: {
        status: "SENT",
        validUntil: {
          lt: now,
        },
      },
      select: {
        id: true,
        proformaNumber: true,
        validUntil: true,
        userId: true,
        partnerId: true,
        clientSnapshot: true,
      },
    });

    if (expiredProformas.length === 0) {
      return NextResponse.json({
        message: "Aucun proforma à expirer",
        count: 0,
      });
    }

    // Marquer les proformas comme expirés
    const result = await prisma.proforma.updateMany({
      where: {
        id: { in: expiredProformas.map((p) => p.id) },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Créer des notifications pour les destinataires (optionnel)
    const notifications = [];
    for (const proforma of expiredProformas) {
      // Déterminer le userId du destinataire
      let recipientId: string | null = null;

      if (proforma.userId) {
        recipientId = proforma.userId;
      } else if (proforma.partnerId) {
        // Récupérer le userId du partenaire
        const partner = await prisma.partner.findUnique({
          where: { id: proforma.partnerId },
          select: { userId: true },
        });
        if (partner?.userId) {
          recipientId = partner.userId;
        }
      }

      if (recipientId) {
        try {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              title: "PROFORMA expiré",
              message: `Le PROFORMA ${proforma.proformaNumber} a expiré le ${new Intl.DateTimeFormat("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              }).format(new Date(proforma.validUntil!))}.`,
              type: "PROFORMA_EXPIRED",
              data: JSON.stringify({
                proformaId: proforma.id,
                proformaNumber: proforma.proformaNumber,
                expiredAt: proforma.validUntil,
              }),
              read: false,
            },
          });
          notifications.push(proforma.proformaNumber);
        } catch (notifError: any) {
          logger.error(
            `[WARNING] Erreur lors de la création de la notification pour ${proforma.proformaNumber}:`,
            notifError
          );
        }
      }
    }

    // Journal d'audit
    logger.debug(
      `[AUDIT] ${result.count} proforma(s) automatiquement marqué(s) comme expiré(s) - ${notifications.length} notification(s) envoyée(s)`
    );

    return NextResponse.json({
      message: `${result.count} proforma(s) marqué(s) comme expiré(s)`,
      count: result.count,
      proformas: expiredProformas.map((p) => p.proformaNumber),
      notificationsSent: notifications.length,
    });
  } catch (error: any) {
    logger.error("❌ ERREUR lors du marquage des proformas expirés:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du marquage des proformas expirés",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// GET /api/pdg/proforma/expire - Vérifier les proformas expirés (sans les marquer)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "PDG") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const now = new Date();

    // Trouver tous les proformas SENT avec validUntil dépassée
    const expiredProformas = await prisma.proforma.findMany({
      where: {
        status: "SENT",
        validUntil: {
          lt: now,
        },
      },
      select: {
        id: true,
        proformaNumber: true,
        validUntil: true,
        createdAt: true,
      },
      orderBy: {
        validUntil: "asc",
      },
    });

    return NextResponse.json({
      count: expiredProformas.length,
      proformas: expiredProformas,
    });
  } catch (error: any) {
    logger.error("❌ ERREUR lors de la vérification des proformas expirés:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la vérification des proformas expirés",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

