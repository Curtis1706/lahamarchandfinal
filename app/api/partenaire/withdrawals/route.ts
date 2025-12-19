/**
 * API Route pour les retraits des partenaires
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

    // Pour les partenaires, on crée un nouveau modèle de retrait
    // ou on réutilise RepresentantWithdrawal avec un flag
    // Pour simplifier, créons PartnerWithdrawal

    // NOTE: Il faudra ajouter un modèle PartnerWithdrawal dans le schéma Prisma
    // Pour l'instant, on utilise une approche temporaire

    return NextResponse.json({
      withdrawals: [],
      message: "À implémenter avec le modèle PartnerWithdrawal dans Prisma"
    });
  } catch (error: any) {
    console.error("Error fetching partner withdrawals:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { amount, method, momoNumber, bankName, bankAccount, bankAccountName } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    const MIN_WITHDRAWAL = 5000;
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Le montant minimum est ${MIN_WITHDRAWAL} F CFA` },
        { status: 400 }
      );
    }

    // Vérifier le solde disponible
    const rebates = await prisma.partnerRebate.findMany({
      where: {
        partnerId: partner.id,
      },
    });

    const totalValidated = rebates
      .filter((r) => r.status === "VALIDATED" || r.status === "PAID")
      .reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = rebates
      .filter((r) => r.status === "PAID")
      .reduce((sum, r) => sum + r.amount, 0);
    const available = totalValidated - totalPaid;

    if (amount > available) {
      return NextResponse.json(
        { error: `Solde insuffisant. Disponible: ${available} F CFA` },
        { status: 400 }
      );
    }

    // NOTE: Créer la demande de retrait
    // Pour l'instant, utilisons RepresentantWithdrawal avec userId du partenaire
    // Idéalement, créer un modèle PartnerWithdrawal séparé

    const withdrawal = await prisma.representantWithdrawal.create({
      data: {
        userId: session.user.id,
        amount: parseFloat(amount),
        method: method as any,
        momoNumber: momoNumber || null,
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        bankAccountName: bankAccountName || null,
        status: "PENDING",
        notes: `Retrait partenaire ${partner.name}`,
      },
    });

    // Notifier le PDG
    await prisma.notification.create({
      data: {
        userId: session.user.id, // Temporaire, devrait être le PDG
        title: "Nouvelle demande de retrait partenaire",
        message: `${partner.name} demande un retrait de ${amount} F CFA`,
        type: "WITHDRAWAL",
        data: JSON.stringify({ withdrawalId: withdrawal.id, type: "partner" }),
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal,
    });
  } catch (error: any) {
    console.error("Error creating partner withdrawal:", error);
    return NextResponse.json(
      { error: "Erreur serveur", message: error.message },
      { status: 500 }
    );
  }
}


