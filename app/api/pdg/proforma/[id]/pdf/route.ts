import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import React from "react";
import { ProformaPdf } from "@/components/pdf/ProformaPdf";

export const dynamic = "force-dynamic";

// GET /api/pdg/proforma/[id]/pdf - Télécharger le PDF d'un proforma
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Seul le PDG peut télécharger le PDF
    if (session.user.role !== "PDG") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const proformaId = params.id;

    // Récupérer le proforma avec toutes ses relations
    const proforma = await prisma.proforma.findUnique({
      where: { id: proformaId },
      include: {
        items: true,
        clientSnapshot: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        partner: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!proforma) {
      return NextResponse.json(
        { error: "Proforma non trouvé" },
        { status: 404 }
      );
    }

    // Déterminer le type de client et les informations
    const clientTypeLabels: Record<string, string> = {
      ECOLE: "École",
      PARTENAIRE: "Partenaire",
      CLIENT: "Client",
      INVITE: "Client invité",
    };

    const recipientTypeLabel =
      clientTypeLabels[proforma.clientType as keyof typeof clientTypeLabels] || proforma.clientType;

    // Récupérer les informations du client (snapshot ou relation)
    const clientSnapshot = proforma.clientSnapshot;
    const clientInfo = clientSnapshot
      ? {
        name: clientSnapshot.name,
        email: clientSnapshot.email || undefined,
        phone: clientSnapshot.phone || undefined,
        address: clientSnapshot.address || undefined,
      }
      : proforma.partner
        ? {
          name: proforma.partner.name,
          email: proforma.partner.email || undefined,
          phone: proforma.partner.phone || undefined,
          address: proforma.partner.address || undefined,
        }
        : proforma.user
          ? {
            name: proforma.user.name,
            email: proforma.user.email || undefined,
            phone: proforma.user.phone || undefined,
            address: undefined,
          }
          : {
            name: "Client inconnu",
            email: undefined,
            phone: undefined,
            address: undefined,
          };

    // Formater les dates
    const issuedAt = new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(proforma.issuedAt || proforma.createdAt));

    const validUntil = proforma.validUntil
      ? new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date(proforma.validUntil))
      : "Non définie";

    // Préparer les items pour le PDF
    const pdfItems = proforma.items.map((item) => ({
      ref: item.reference || null,
      isbn: item.isbn || null,
      title: item.title || "Article sans titre",
      quantity: item.quantity,
      unitPriceHT: item.unitPriceHT || 0,
      discountRate: item.discountRate || 0,
      tvaRate: item.tvaRate || 0.18,
      totalTTC: item.totalTTC,
    }));

    // Informations de l'entreprise
    const companyInfo = {
      name: "LAHA ÉDITIONS GABON",
      country: "GABON",
      address: "6ᵉ Arrondissement (c.194.ZL)\n142 Av. Jean Léon MEGUIRE ME MBA\nNouvelle Cité NZENG AGNON\nLIBREVILLE (GABON)",
      email: "contact@lahamarchand.com",
      phone: "",
      rccm: "GA-LBV-01-2022-A10-00255",
    };

    // Générer le PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(ProformaPdf, {
        proformaNumber: proforma.proformaNumber || "N/A",
        status: proforma.status as any,
        issuedAt,
        validUntil,
        company: companyInfo,
        recipient: {
          typeLabel: recipientTypeLabel || "Client",
          ...clientInfo,
        },
        items: pdfItems,
        totals: {
          subtotalHT: proforma.subtotalHT || 0,
          discountTotal: proforma.discountTotal || 0,
          taxableBase: proforma.taxableBase || 0,
          tvaTotal: proforma.tvaTotal || 0,
          totalTTC: proforma.totalTTC || 0,
          currency: proforma.currency === "FCFA" ? "FCFA" : (proforma.currency as any) || "FCFA",
        },
        createdBy: proforma.createdBy?.name || "PDG",
        notes: proforma.notes || undefined,
      }) as any
    );

    const filename = proforma.proformaNumber || `proforma-${proforma.id}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    logger.error("Erreur lors de la génération du PDF:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du PDF",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}