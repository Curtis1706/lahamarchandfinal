import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/partenaire/sales/register
 * 
 * Enregistre une vente partenaire (déduit le stock partenaire alloué).
 * 
 * RÈGLES CRITIQUES:
 * - Le partenaire ne peut vendre que depuis son stock alloué
 * - La vente déduit immédiatement le stock partenaire (pas le stock central)
 * - Utilise FOR UPDATE pour éviter les ventes simultanées (concurrence)
 * - Formule: available = allocatedQuantity - soldQuantity + returnedQuantity
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "PARTENAIRE") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { workId, quantity, clientName, clientPhone, notes } = body;

    const qty = Number(quantity);
    if (!workId || !Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "workId et quantity (>0) requis" },
        { status: 400 }
      );
    }

    // Récupérer le partenaire (ownership)
    const partner = await prisma.partner.findFirst({
      where: { userId: session.user.id },
      select: { id: true, name: true }
    });

    if (!partner) {
      return NextResponse.json({ error: "Partenaire non trouvé" }, { status: 404 });
    }

    // Transaction avec FOR UPDATE pour éviter les ventes simultanées
    const result = await prisma.$transaction(async (tx) => {
      // 1) Lock la ligne PartnerStock concernée (FOR UPDATE)
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          allocatedQuantity: number;
          soldQuantity: number;
          returnedQuantity: number;
          workTitle: string;
          isbn: string | null;
          workPrice: number;
        }>
      >`
        SELECT ps."id",
               ps."allocatedQuantity",
               ps."soldQuantity",
               ps."returnedQuantity",
               w."title" as "workTitle",
               w."isbn" as "isbn",
               w."price" as "workPrice"
        FROM "PartnerStock" ps
        JOIN "Work" w ON w."id" = ps."workId"
        WHERE ps."partnerId" = ${partner.id} AND ps."workId" = ${workId}
        FOR UPDATE
      `;

      const ps = rows[0];
      if (!ps) {
        throw { code: 400, message: "Cette œuvre n'est pas allouée à votre stock" };
      }

      // 2) Calculer le stock disponible (formule correcte)
      const available = ps.allocatedQuantity - ps.soldQuantity + ps.returnedQuantity;
      if (available < qty) {
        throw {
          code: 400,
          message: `Stock insuffisant. Disponible: ${available}, Demandé: ${qty}`
        };
      }

      // 3) Mettre à jour le stock partenaire (incrémenter soldQuantity uniquement)
      const updated = await tx.partnerStock.update({
        where: { id: ps.id },
        data: {
          soldQuantity: { increment: qty },
          updatedAt: new Date()
        }
      });

      // 4) Calculer le montant total
      const unitPrice = ps.workPrice || 0
      const totalAmount = unitPrice * qty

      // 5) Créer un mouvement de stock (sortie)
      await tx.stockMovement.create({
        data: {
          workId,
          type: "PARTNER_SALE",
          quantity: -qty, // Négatif car sortie
          unitPrice: unitPrice,
          totalAmount: totalAmount,
          reason: `Vente partenaire - ${clientName || "Client"}`,
          reference: `PSALE_${partner.id}_${Date.now()}`,
          performedBy: session.user.id,
          partnerId: partner.id,
          source: "PARTNER_STOCK",
          destination: "CLIENT"
        }
      });

      // 6) Notification au PDG (CORRIGÉ: chercher le PDG, pas utiliser session.user.id)
      const pdg = await tx.user.findFirst({
        where: { role: "PDG" },
        select: { id: true }
      });

      if (pdg) {
        await tx.notification.create({
          data: {
            userId: pdg.id, // ✅ PDG, pas le partenaire
            title: "Vente enregistrée par partenaire",
            message: `Le partenaire ${partner.name} a vendu ${qty} exemplaire(s) de "${ps.workTitle}"`,
            type: "PARTNER_SALE",
            data: JSON.stringify({
              partnerId: partner.id,
              partnerName: partner.name,
              workId,
              workTitle: ps.workTitle,
              quantity: qty,
              clientName,
              clientPhone,
              notes
            })
          }
        });
      }

      const remaining = updated.allocatedQuantity - updated.soldQuantity + updated.returnedQuantity;

      return {
        workTitle: ps.workTitle,
        isbn: ps.isbn,
        remaining
      };
    }, {
      timeout: 10000, // 10 secondes max
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vente enregistrée avec succès",
        stock: {
          workId,
          workTitle: result.workTitle,
          soldQuantity: qty,
          remainingStock: result.remaining
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Erreur lors de l'enregistrement de la vente:", error);
    
    // Gestion des erreurs de validation
    if (error.code === 400) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
