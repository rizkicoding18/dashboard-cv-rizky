import { addDays } from "@/lib/format";
import { createId, nextNumber } from "@/lib/ids";
import type { Database, Order, Quotation, QuotationKind } from "@/lib/types";

export const QUOTATION_KIND_LABEL: Record<QuotationKind, string> = {
  sph: "Surat Penawaran Harga",
  negosiasi: "Penawaran Harga Negosiasi",
};

export const QUOTATION_NUMBER_PREFIX: Record<QuotationKind, string> = {
  sph: "SPH",
  negosiasi: "NGS",
};

export function defaultQuotationCopy(kind: QuotationKind, sourceNumber?: string | null) {
  if (kind === "negosiasi") {
    return {
      subject: "Penawaran Harga Negosiasi",
      intro: sourceNumber
        ? `Dengan hormat,\nMenindaklanjuti surat penawaran ${sourceNumber} serta pembahasan harga, bersama ini kami sampaikan penawaran harga negosiasi sebagai berikut:`
        : "Dengan hormat,\nMenindaklanjuti pembahasan harga, bersama ini kami sampaikan penawaran harga negosiasi sebagai berikut:",
    };
  }
  return {
    subject: "Penawaran Harga",
    intro:
      "Dengan hormat,\nBersama ini kami sampaikan penawaran harga sesuai permintaan Bapak/Ibu, dengan rincian sebagai berikut:",
  };
}

export function buildSphFromOrder(db: Database, order: Order): Quotation {
  const copy = defaultQuotationCopy("sph");
  return {
    id: createId("qtn"),
    number: nextNumber(
      QUOTATION_NUMBER_PREFIX.sph,
      db.quotations.filter((item) => item.kind === "sph").map((item) => item.number),
    ),
    kind: "sph",
    orderId: order.id,
    customerId: order.customerId,
    sourceId: null,
    date: order.date,
    validUntil: addDays(order.date, 14),
    subject: copy.subject,
    intro: copy.intro,
    terms: "",
    notes: "",
    items: order.items.map((item) => ({
      ...item,
      id: createId("li"),
    })),
    discount: 0,
    includePpn: true,
    ppnRate: db.profile.defaultPpnRate,
    bankId: null,
    createdAt: new Date().toISOString(),
  };
}
