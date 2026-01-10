import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { 
    padding: 36, 
    fontSize: 10, 
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff"
  },
  row: { flexDirection: "row" },
  col: { flexDirection: "column" },
  header: { marginBottom: 14 },
  brand: { fontSize: 16, fontWeight: 700 },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: 1, marginBottom: 4 },
  muted: { color: "#6B7280", fontSize: 9 },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  section: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    marginTop: 10,
  },
  grid2: { flexDirection: "row", gap: 20, marginBottom: 16 },
  box: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
  },
  boxTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6 },
  table: { 
    marginTop: 10, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    borderRadius: 6 
  },
  thead: {
    flexDirection: "row",
    backgroundColor: "#111827",
    color: "white",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  th: { fontSize: 9, fontWeight: 700 },
  tbodyRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  td: { fontSize: 9 },
  right: { textAlign: "right" },
  wRef: { width: "15%" },
  wDesc: { width: "30%" },
  wQty: { width: "8%" },
  wUnit: { width: "12%" },
  wDisc: { width: "10%" },
  wTva: { width: "10%" },
  wTotal: { width: "15%" },
  totals: {
    marginTop: 10,
    alignSelf: "flex-end",
    width: "48%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 10,
  },
  totalRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 4 
  },
  totalLabel: { fontSize: 9, color: "#374151" },
  totalValue: { fontSize: 9, fontWeight: 700 },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footer: { 
    marginTop: 16, 
    fontSize: 8, 
    color: "#6B7280", 
    lineHeight: 1.4 
  },
});

type ProformaItem = {
  ref?: string | null;
  isbn?: string | null;
  title: string;
  quantity: number;
  unitPriceHT: number;
  discountRate?: number;
  tvaRate: number;
  totalTTC: number;
};

type ProformaPdfProps = {
  proformaNumber: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  issuedAt: string;
  validUntil: string;
  company: {
    name: string;
    country: string;
    address: string;
    email: string;
    phone: string;
    rccm?: string;
    ifu?: string;
  };
  recipient: {
    typeLabel: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: ProformaItem[];
  totals: {
    subtotalHT: number;
    discountTotal: number;
    taxableBase: number;
    tvaTotal: number;
    totalTTC: number;
    currency: "FCFA" | "XOF" | "XAF";
  };
  createdBy: string;
  notes?: string;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function getStatusLabel(status: ProformaPdfProps["status"]) {
  const labels: Record<ProformaPdfProps["status"], string> = {
    DRAFT: "BROUILLON",
    SENT: "ENVOYÉ",
    ACCEPTED: "ACCEPTÉ",
    EXPIRED: "EXPIRÉ",
    CANCELLED: "ANNULÉ",
  };
  return labels[status] || status;
}

function statusStyle(status: ProformaPdfProps["status"]) {
  switch (status) {
    case "ACCEPTED":
      return { backgroundColor: "#DCFCE7", color: "#166534" };
    case "SENT":
      return { backgroundColor: "#DBEAFE", color: "#1D4ED8" };
    case "EXPIRED":
      return { backgroundColor: "#FEF3C7", color: "#92400E" };
    case "CANCELLED":
      return { backgroundColor: "#FEE2E2", color: "#991B1B" };
    default:
      return { backgroundColor: "#E5E7EB", color: "#111827" };
  }
}

export function ProformaPdf(props: ProformaPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={[styles.row, styles.header, { justifyContent: "space-between" }]}>
          <View style={styles.col}>
            <Text style={styles.brand}>{props.company.name}</Text>
            <Text style={styles.muted}>{props.company.country}</Text>
            <Text style={styles.muted}>{props.company.address}</Text>
            <Text style={styles.muted}>
              {props.company.email} • {props.company.phone}
            </Text>
            {(props.company.rccm || props.company.ifu) && (
              <Text style={styles.muted}>
                {props.company.rccm ? `RCCM: ${props.company.rccm}` : ""}{" "}
                {props.company.ifu ? `IFU: ${props.company.ifu}` : ""}
              </Text>
            )}
          </View>

          <View style={[styles.col, { alignItems: "flex-end" }]}>
            <Text style={styles.title}>PROFORMA</Text>
            <Text style={styles.muted}>Réf : {props.proformaNumber}</Text>
            <View style={[styles.pill, statusStyle(props.status)]}>
              <Text>{getStatusLabel(props.status)}</Text>
            </View>
            <Text style={[styles.muted, { marginTop: 4 }]}>
              Date : {props.issuedAt}
            </Text>
            <Text style={styles.muted}>
              Valable jusqu'au : {props.validUntil}
            </Text>
          </View>
        </View>

        {/* Recipient & Info */}
        <View style={styles.grid2}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>DESTINATAIRE</Text>
            <Text style={styles.muted}>Type : {props.recipient.typeLabel}</Text>
            <Text style={{ marginTop: 4 }}>Nom : {props.recipient.name}</Text>
            {props.recipient.email && (
              <Text style={styles.muted}>Email : {props.recipient.email}</Text>
            )}
            {props.recipient.phone && (
              <Text style={styles.muted}>
                Téléphone : {props.recipient.phone}
              </Text>
            )}
            {props.recipient.address && (
              <Text style={styles.muted}>
                Adresse : {props.recipient.address}
              </Text>
            )}
          </View>

          <View style={styles.box}>
            <Text style={styles.boxTitle}>INFORMATIONS</Text>
            <Text style={styles.muted}>
              Date d'émission : {props.issuedAt}
            </Text>
            <Text style={styles.muted}>
              Valable jusqu'au : {props.validUntil}
            </Text>
            <Text style={styles.muted}>Créé par : {props.createdBy}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.thead}>
            <Text style={[styles.th, styles.wRef]}>Réf/ISBN</Text>
            <Text style={[styles.th, styles.wDesc]}>Description</Text>
            <Text style={[styles.th, styles.wQty, styles.right]}>Qté</Text>
            <Text style={[styles.th, styles.wUnit, styles.right]}>PU HT</Text>
            <Text style={[styles.th, styles.wDisc, styles.right]}>Remise</Text>
            <Text style={[styles.th, styles.wTva, styles.right]}>TVA</Text>
            <Text style={[styles.th, styles.wTotal, styles.right]}>Total</Text>
          </View>

          {props.items.map((it, idx) => {
            const ref = it.ref || it.isbn || "-";
            const disc = it.discountRate
              ? `${Math.round(it.discountRate * 100)}%`
              : "0%";
            const tva = `${Math.round(it.tvaRate * 100)}%`;

            return (
              <View key={idx} style={styles.tbodyRow}>
                <Text style={[styles.td, styles.wRef]}>{ref}</Text>
                <Text style={[styles.td, styles.wDesc]}>{it.title}</Text>
                <Text style={[styles.td, styles.wQty, styles.right]}>
                  {it.quantity}
                </Text>
                <Text style={[styles.td, styles.wUnit, styles.right]}>
                  {formatMoney(it.unitPriceHT)}
                </Text>
                <Text style={[styles.td, styles.wDisc, styles.right]}>
                  {disc}
                </Text>
                <Text style={[styles.td, styles.wTva, styles.right]}>
                  {tva}
                </Text>
                <Text style={[styles.td, styles.wTotal, styles.right]}>
                  {formatMoney(it.totalTTC)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>
              {formatMoney(props.totals.subtotalHT)} {props.totals.currency}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Remise totale</Text>
            <Text style={styles.totalValue}>
              - {formatMoney(props.totals.discountTotal)} {props.totals.currency}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Base taxable</Text>
            <Text style={styles.totalValue}>
              {formatMoney(props.totals.taxableBase)} {props.totals.currency}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>
              {formatMoney(props.totals.tvaTotal)} {props.totals.currency}
            </Text>
          </View>

          <View style={[styles.grandTotal, styles.totalRow]}>
            <Text style={[styles.totalLabel, { fontWeight: 700 }]}>
              TOTAL TTC
            </Text>
            <Text style={[styles.totalValue, { fontSize: 11 }]}>
              {formatMoney(props.totals.totalTTC)} {props.totals.currency}
            </Text>
          </View>
        </View>

        {/* Notes + Legal */}
        <View style={styles.section}>
          {props.notes && (
            <Text style={{ fontSize: 9, marginBottom: 8 }}>
              <Text style={{ fontWeight: 700 }}>Notes :</Text> {props.notes}
            </Text>
          )}
          <Text style={styles.footer}>
            Ce document est un proforma (devis) et ne constitue pas une facture.
            Il n'exige aucun paiement tant qu'il n'est pas accepté. La facture
            définitive sera émise après paiement. Validité : jusqu'à la date
            indiquée.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
