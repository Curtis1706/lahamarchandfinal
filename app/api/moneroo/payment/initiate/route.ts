/**
 * Route API pour initier un paiement Moneroo
 * 
 * Cette route crée une demande de paiement auprès de Moneroo
 * et retourne l'URL de paiement pour rediriger le client
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getMonerooService } from "@/lib/moneroo";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel pour les invités)
    const session = await getServerSession(authOptions);
    
    const body = await request.json();
    const { orderId, customerEmail, customerName, customerPhone } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Récupérer la commande
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            work: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Vérifier que la commande n'est pas déjà payée
    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Order already paid" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur connecté est le propriétaire de la commande
    // (sauf pour les invités)
    if (session?.user?.id && order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Préparer les informations du client
    const customer = {
      email: customerEmail || order.user?.email || "",
      name: customerName || order.user?.name || "Client",
      phone: customerPhone || order.user?.phone || "",
    };

    // Générer la description de la commande
    const itemDescriptions = order.items
      .map((item) => `${item.work.title} (x${item.quantity})`)
      .join(", ");
    const description = `Commande #${orderId.slice(-8)} - ${itemDescriptions}`;

    // Récupérer l'URL de base de l'application
    const baseUrl = process.env.NEXTAUTH_URL || request.headers.get("origin") || "http://localhost:3000";

    // Initier le paiement via Moneroo
    const monerooService = getMonerooService();
    const paymentResponse = await monerooService.initiatePayment({
      amount: order.total,
      currency: "XOF", // Franc CFA
      description: description,
      customer: customer,
      return_url: `${baseUrl}/commande-confirmee?orderId=${orderId}`,
      cancel_url: `${baseUrl}/checkout?orderId=${orderId}&cancelled=true`,
      webhook_url: `${baseUrl}/api/moneroo/webhook`,
      metadata: {
        order_id: orderId,
        customer_id: order.userId,
        items_count: order.items.length,
      },
    });

    if (!paymentResponse.success || !paymentResponse.data) {
      console.error("❌ Failed to initiate Moneroo payment:", paymentResponse.error);
      return NextResponse.json(
        { 
          error: "Failed to initiate payment", 
          message: paymentResponse.message || paymentResponse.error 
        },
        { status: 500 }
      );
    }

    // Mettre à jour la commande avec l'ID du paiement Moneroo
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentReference: paymentResponse.data.payment_id,
        paymentMethod: "Moneroo",
      },
    });

    console.log(`✅ Payment initiated for order ${orderId}: ${paymentResponse.data.payment_id}`);

    return NextResponse.json({
      success: true,
      payment_id: paymentResponse.data.payment_id,
      payment_url: paymentResponse.data.payment_url,
      amount: paymentResponse.data.amount,
      currency: paymentResponse.data.currency,
    });
  } catch (error: any) {
    console.error("❌ Error initiating payment:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Route GET pour vérifier le statut d'un paiement
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId is required" },
        { status: 400 }
      );
    }

    // Récupérer les détails du paiement via Moneroo
    const monerooService = getMonerooService();
    const paymentDetails = await monerooService.getPaymentDetails(paymentId);

    if (!paymentDetails) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: paymentDetails,
    });
  } catch (error: any) {
    console.error("❌ Error getting payment status:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}


