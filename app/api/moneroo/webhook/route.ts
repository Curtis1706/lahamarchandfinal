/**
 * Webhook Moneroo
 * 
 * Ce endpoint reçoit les notifications de Moneroo concernant les paiements et retraits
 * Documentation: https://api.moneroo.io/v1
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getMonerooService } from "@/lib/moneroo";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Récupérer le corps de la requête
    const body = await request.json();
    const signature = request.headers.get("x-moneroo-signature") || "";

    console.log("🔔 Moneroo Webhook received:", body);

    // Vérifier la signature du webhook
    const monerooService = getMonerooService();
    const rawBody = JSON.stringify(body);
    const isValid = monerooService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parser l'événement
    const event = monerooService.parseWebhookEvent(body);
    if (!event) {
      console.error("❌ Invalid webhook event structure");
      return NextResponse.json(
        { error: "Invalid event structure" },
        { status: 400 }
      );
    }

    // Traiter l'événement selon son type
    switch (event.event) {
      case "payment.success":
        await handlePaymentSuccess(event);
        break;
      
      case "payment.failed":
        await handlePaymentFailed(event);
        break;
      
      case "payment.cancelled":
        await handlePaymentCancelled(event);
        break;
      
      case "payout.success":
        await handlePayoutSuccess(event);
        break;
      
      case "payout.failed":
        await handlePayoutFailed(event);
        break;
      
      default:
        console.warn(`⚠️ Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("❌ Error processing Moneroo webhook:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Gérer un paiement réussi
 */
async function handlePaymentSuccess(event: any) {
  try {
    console.log("✅ Processing payment success:", event.data.transaction_id);

    const { transaction_id, amount, metadata } = event.data;

    // Récupérer l'ID de la commande depuis les métadonnées
    const orderId = metadata?.order_id;
    if (!orderId) {
      console.error("❌ No order_id in payment metadata");
      return;
    }

    // Récupérer la commande
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            work: {
              include: {
                author: true,
              },
            },
          },
        },
        user: true,
        partner: true,
      },
    });

    if (!order) {
      console.error(`❌ Order not found: ${orderId}`);
      return;
    }

    // Mettre à jour la commande
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        paymentReference: transaction_id,
        amountPaid: amount,
        remainingAmount: 0,
        fullPaymentDate: new Date(),
        status: order.status === "PENDING" ? "VALIDATED" : order.status,
      },
    });

    // Enregistrer le paiement
    await prisma.payment.create({
      data: {
        orderId: orderId,
        amount: amount,
        paymentMethod: "Moneroo",
        paymentReference: transaction_id,
        paymentDate: new Date(),
        notes: `Paiement Moneroo confirmé`,
        recordedById: order.userId,
      },
    });

    // Décrémenter le stock pour chaque item
    for (const item of order.items) {
      await prisma.work.update({
        where: { id: item.workId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      // Enregistrer le mouvement de stock
      await prisma.stockMovement.create({
        data: {
          workId: item.workId,
          type: "OUTBOUND",
          quantity: item.quantity,
          reason: "Vente validée via Moneroo",
          reference: orderId,
          performedBy: order.userId,
          unitPrice: item.price,
          totalAmount: item.price * item.quantity,
        },
      });
    }

    // Calculer et créer les royalties pour les auteurs
    await calculateAndCreateRoyalties(order);

    // Calculer et créer les ristournes pour les partenaires (si applicable)
    if (order.partnerId) {
      await calculateAndCreatePartnerRebates(order);
    }

    // Créer une notification pour le client
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Paiement confirmé",
        message: `Votre paiement de ${amount} XOF a été confirmé. Votre commande est en cours de traitement.`,
        type: "PAYMENT",
        data: JSON.stringify({ orderId, transactionId: transaction_id }),
      },
    });

    console.log(`✅ Payment processed successfully for order ${orderId}`);
  } catch (error: any) {
    console.error("❌ Error handling payment success:", error);
    throw error;
  }
}

/**
 * Gérer un paiement échoué
 */
async function handlePaymentFailed(event: any) {
  try {
    console.log("❌ Processing payment failure:", event.data.transaction_id);

    const { transaction_id, metadata } = event.data;
    const orderId = metadata?.order_id;

    if (!orderId) {
      console.error("❌ No order_id in payment metadata");
      return;
    }

    // Mettre à jour la commande
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "UNPAID",
        paymentReference: transaction_id,
      },
    });

    // Récupérer les infos de l'utilisateur
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, total: true },
    });

    if (order) {
      // Créer une notification
      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: "Paiement échoué",
          message: `Le paiement de ${order.total} XOF a échoué. Veuillez réessayer.`,
          type: "PAYMENT",
          data: JSON.stringify({ orderId, transactionId: transaction_id }),
        },
      });
    }

    console.log(`❌ Payment failed for order ${orderId}`);
  } catch (error: any) {
    console.error("❌ Error handling payment failure:", error);
    throw error;
  }
}

/**
 * Gérer un paiement annulé
 */
async function handlePaymentCancelled(event: any) {
  try {
    console.log("⚠️ Processing payment cancellation:", event.data.transaction_id);

    const { transaction_id, metadata } = event.data;
    const orderId = metadata?.order_id;

    if (!orderId) {
      console.error("❌ No order_id in payment metadata");
      return;
    }

    // Mettre à jour la commande
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "CANCELLED",
        paymentReference: transaction_id,
        status: "CANCELLED",
      },
    });

    console.log(`⚠️ Payment cancelled for order ${orderId}`);
  } catch (error: any) {
    console.error("❌ Error handling payment cancellation:", error);
    throw error;
  }
}

/**
 * Gérer un retrait réussi
 */
async function handlePayoutSuccess(event: any) {
  try {
    console.log("✅ Processing payout success:", event.data.payout_id);

    const { payout_id, amount, metadata } = event.data;

    // Récupérer l'ID du retrait depuis les métadonnées
    const withdrawalId = metadata?.withdrawal_id;
    const withdrawalType = metadata?.withdrawal_type; // "author", "representant" ou "partner"

    if (!withdrawalId) {
      console.error("❌ No withdrawal_id in payout metadata");
      return;
    }

    if (withdrawalType === "author") {
      // Mettre à jour le retrait auteur
      const withdrawal = await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
        include: { user: true },
      });

      // Marquer les royalties comme payées
      await prisma.royalty.updateMany({
        where: {
          userId: withdrawal.userId,
          paid: false,
          approved: true,
        },
        data: {
          paid: true,
          paidAt: new Date(),
        },
      });

      // Créer une notification
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          title: "Retrait effectué",
          message: `Votre retrait de ${amount} XOF a été effectué avec succès.`,
          type: "WITHDRAWAL",
          data: JSON.stringify({ withdrawalId, payoutId: payout_id }),
        },
      });

      console.log(`✅ Author withdrawal ${withdrawalId} marked as paid`);
    } else if (withdrawalType === "representant") {
      // Mettre à jour le retrait représentant
      const withdrawal = await prisma.representantWithdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
        include: { user: true },
      });

      // Créer une notification
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          title: "Retrait effectué",
          message: `Votre retrait de ${amount} XOF a été effectué avec succès.`,
          type: "WITHDRAWAL",
          data: JSON.stringify({ withdrawalId, payoutId: payout_id }),
        },
      });

      console.log(`✅ Representant withdrawal ${withdrawalId} marked as paid`);
    } else if (withdrawalType === "partner") {
      // Mettre à jour le retrait partenaire (stocké dans RepresentantWithdrawal)
      const withdrawal = await prisma.representantWithdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
        include: { user: true },
      });

      // Marquer les ristournes partenaires comme payées
      const partner = await prisma.partner.findUnique({
        where: { userId: withdrawal.userId },
      });

      if (partner) {
        await prisma.partnerRebate.updateMany({
          where: {
            partnerId: partner.id,
            status: "VALIDATED",
          },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });
      }

      // Créer une notification
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          title: "Retrait effectué",
          message: `Votre retrait de ${amount} XOF a été effectué avec succès.`,
          type: "WITHDRAWAL",
          data: JSON.stringify({ withdrawalId, payoutId: payout_id }),
        },
      });

      console.log(`✅ Partner withdrawal ${withdrawalId} marked as paid`);
    }
  } catch (error: any) {
    console.error("❌ Error handling payout success:", error);
    throw error;
  }
}

/**
 * Gérer un retrait échoué
 */
async function handlePayoutFailed(event: any) {
  try {
    console.log("❌ Processing payout failure:", event.data.payout_id);

    const { payout_id, metadata } = event.data;
    const withdrawalId = metadata?.withdrawal_id;
    const withdrawalType = metadata?.withdrawal_type;

    if (!withdrawalId) {
      console.error("❌ No withdrawal_id in payout metadata");
      return;
    }

    if (withdrawalType === "author") {
      // Mettre à jour le statut du retrait
      const withdrawal = await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          rejectionReason: "Échec du paiement via Moneroo",
        },
        include: { user: true },
      });

      // Créer une notification
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          title: "Retrait échoué",
          message: `Le retrait de ${withdrawal.amount} XOF a échoué. Veuillez contacter le support.`,
          type: "WITHDRAWAL",
          data: JSON.stringify({ withdrawalId, payoutId: payout_id }),
        },
      });
    } else if (withdrawalType === "representant") {
      const withdrawal = await prisma.representantWithdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          rejectionReason: "Échec du paiement via Moneroo",
        },
        include: { user: true },
      });

      // Créer une notification
      await prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          title: "Retrait échoué",
          message: `Le retrait de ${withdrawal.amount} XOF a échoué. Veuillez contacter le support.`,
          type: "WITHDRAWAL",
          data: JSON.stringify({ withdrawalId, payoutId: payout_id }),
        },
      });
    }

    console.log(`❌ Withdrawal ${withdrawalId} marked as failed`);
  } catch (error: any) {
    console.error("❌ Error handling payout failure:", error);
    throw error;
  }
}

/**
 * Calculer et créer les royalties pour une commande
 */
async function calculateAndCreateRoyalties(order: any) {
  try {
    for (const item of order.items) {
      const work = item.work;
      const author = work.author;

      // Récupérer le taux de royalty pour cet auteur/œuvre
      const rebateRate = await prisma.rebateRate.findFirst({
        where: {
          OR: [
            { type: "AUTHOR", userId: author.id, isActive: true },
            { type: "WORK", workId: work.id, isActive: true },
            { type: "GLOBAL", isActive: true },
          ],
        },
        orderBy: [
          { type: "asc" }, // WORK > AUTHOR > GLOBAL
        ],
      });

      const royaltyRate = rebateRate?.rate || 10; // Taux par défaut: 10%
      const royaltyAmount = (item.price * item.quantity * royaltyRate) / 100;

      // Créer la royalty
      await prisma.royalty.create({
        data: {
          workId: work.id,
          userId: author.id,
          orderId: order.id,
          amount: royaltyAmount,
          rate: royaltyRate,
          approved: false, // Le PDG doit approuver
        },
      });

      console.log(`✅ Royalty created: ${royaltyAmount} XOF for author ${author.name}`);
    }
  } catch (error: any) {
    console.error("❌ Error calculating royalties:", error);
    throw error;
  }
}

/**
 * Calculer et créer les ristournes partenaires pour une commande
 */
async function calculateAndCreatePartnerRebates(order: any) {
  try {
    if (!order.partner) return;

    for (const item of order.items) {
      // Récupérer le taux de ristourne pour ce partenaire/œuvre
      const rebateRate = await prisma.rebateRate.findFirst({
        where: {
          OR: [
            { type: "PARTNER", partnerId: order.partnerId, isActive: true },
            { type: "WORK", workId: item.workId, isActive: true },
            { type: "GLOBAL", isActive: true },
          ],
        },
        orderBy: [
          { type: "asc" }, // PARTNER > WORK > GLOBAL
        ],
      });

      const rebateRateValue = rebateRate?.rate || 5; // Taux par défaut: 5%
      const rebateAmount = (item.price * item.quantity * rebateRateValue) / 100;

      // Créer la ristourne
      await prisma.partnerRebate.create({
        data: {
          partnerId: order.partnerId,
          orderId: order.id,
          workId: item.workId,
          amount: rebateAmount,
          rate: rebateRateValue,
          status: "PENDING", // Le PDG doit valider
        },
      });

      console.log(`✅ Rebate created: ${rebateAmount} XOF for partner ${order.partner.name}`);
    }
  } catch (error: any) {
    console.error("❌ Error calculating partner rebates:", error);
    throw error;
  }
}

