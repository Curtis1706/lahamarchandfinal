/**
 * Route API pour initier un retrait (payout) via Moneroo
 * 
 * Cette route est utilisée par le PDG pour effectuer les retraits
 * des auteurs et représentants après validation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMonerooService } from "@/lib/moneroo";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle PDG
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "PDG") {
      return NextResponse.json(
        { error: "Forbidden - PDG role required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { withdrawalId, withdrawalType } = body; // withdrawalType: "author", "representant" ou "partner"

    if (!withdrawalId || !withdrawalType) {
      return NextResponse.json(
        { error: "withdrawalId and withdrawalType are required" },
        { status: 400 }
      );
    }

    let withdrawal: any;
    let beneficiary: any;

    // Récupérer le retrait selon son type
    if (withdrawalType === "author") {
      withdrawal = await prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
          user: true,
        },
      });
    } else if (withdrawalType === "representant" || withdrawalType === "partner") {
      withdrawal = await prisma.representantWithdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
          user: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid withdrawalType. Must be 'author', 'representant' or 'partner'" },
        { status: 400 }
      );
    }

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    // Vérifier que le retrait est approuvé et pas encore payé
    if (withdrawal.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Withdrawal must be approved before payout" },
        { status: 400 }
      );
    }

    beneficiary = withdrawal.user;

    // Déterminer la méthode de paiement
    let payoutMethod: "mobile_money" | "bank_transfer" | "cash" = "mobile_money";
    let phone: string | undefined;
    let bankAccount: string | undefined;

    if (withdrawal.method === "MOMO") {
      payoutMethod = "mobile_money";
      phone = withdrawal.momoNumber || beneficiary.phone;
    } else if (withdrawal.method === "BANK") {
      payoutMethod = "bank_transfer";
      bankAccount = withdrawal.bankAccount;
    } else if (withdrawal.method === "CASH") {
      payoutMethod = "cash";
    }

    // Vérifier les informations requises
    if (payoutMethod === "mobile_money" && !phone) {
      return NextResponse.json(
        { error: "Mobile Money number is required for mobile_money payout" },
        { status: 400 }
      );
    }

    if (payoutMethod === "bank_transfer" && !bankAccount) {
      return NextResponse.json(
        { error: "Bank account is required for bank_transfer payout" },
        { status: 400 }
      );
    }

    // Initier le retrait via Moneroo
    const monerooService = getMonerooService();
    const payoutResponse = await monerooService.initiatePayout({
      amount: withdrawal.amount,
      currency: "XOF", // Franc CFA
      method: payoutMethod,
      phone: phone,
      bank_account: bankAccount,
      beneficiary_name: withdrawal.bankAccountName || beneficiary.name,
      beneficiary_email: beneficiary.email,
      description: `Retrait ${withdrawalType} - ${beneficiary.name}`,
      metadata: {
        withdrawal_id: withdrawalId,
        withdrawal_type: withdrawalType,
        beneficiary_id: beneficiary.id,
        beneficiary_name: beneficiary.name,
      },
    });

    if (!payoutResponse.success || !payoutResponse.data) {
      console.error("❌ Failed to initiate Moneroo payout:", payoutResponse.error);
      
      // Marquer le retrait comme rejeté
      if (withdrawalType === "author") {
        await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: "REJECTED",
            rejectionReason: payoutResponse.message || payoutResponse.error || "Échec de l'initiation du paiement",
          },
        });
      } else {
        await prisma.representantWithdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: "REJECTED",
            rejectionReason: payoutResponse.message || payoutResponse.error || "Échec de l'initiation du paiement",
          },
        });
      }

      return NextResponse.json(
        { 
          error: "Failed to initiate payout", 
          message: payoutResponse.message || payoutResponse.error 
        },
        { status: 500 }
      );
    }

    // Mettre à jour le statut du retrait (en attente de confirmation)
    // Le webhook Moneroo mettra à jour à "PAID" quand le paiement sera confirmé
    // Note: on ne met pas encore à PAID ici, on attend le webhook
    
    console.log(`✅ Payout initiated for ${withdrawalType} withdrawal ${withdrawalId}: ${payoutResponse.data.payout_id}`);

    // Créer une notification pour le bénéficiaire
    await prisma.notification.create({
      data: {
        userId: beneficiary.id,
        title: "Retrait en cours",
        message: `Votre retrait de ${withdrawal.amount} XOF est en cours de traitement.`,
        type: "WITHDRAWAL",
        data: JSON.stringify({ 
          withdrawalId, 
          payoutId: payoutResponse.data.payout_id 
        }),
      },
    });

    return NextResponse.json({
      success: true,
      payout_id: payoutResponse.data.payout_id,
      status: payoutResponse.data.status,
      amount: payoutResponse.data.amount,
      currency: payoutResponse.data.currency,
      beneficiary_name: payoutResponse.data.beneficiary_name,
    });
  } catch (error: any) {
    console.error("❌ Error initiating payout:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Route GET pour vérifier le statut d'un payout
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et le rôle PDG
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "PDG") {
      return NextResponse.json(
        { error: "Forbidden - PDG role required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const payoutId = searchParams.get("payoutId");

    if (!payoutId) {
      return NextResponse.json(
        { error: "payoutId is required" },
        { status: 400 }
      );
    }

    // Récupérer les détails du payout via Moneroo
    const monerooService = getMonerooService();
    const payoutDetails = await monerooService.getPayoutStatus(payoutId);

    if (!payoutDetails) {
      return NextResponse.json(
        { error: "Payout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payout: payoutDetails,
    });
  } catch (error: any) {
    console.error("❌ Error getting payout status:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

