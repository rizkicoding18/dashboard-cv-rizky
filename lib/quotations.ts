import { addDays } from "@/lib/format";
import { createId, nextNumber } from "@/lib/ids";
import type { Database, DraftLine, Invoice, LineItem, Order, Quotation, QuotationKind } from "@/lib/types";

export const QUOTATION_KIND_LABEL: Record<QuotationKind, string> = {
  sph: "Surat Penawaran Harga",
  negosiasi: "Penawaran Harga Negosiasi",
};

export const QUOTATION_COVER_ITEM_THRESHOLD = 10;

export function quotationUsesCoverLetter(itemCount: number) {
  return itemCount > QUOTATION_COVER_ITEM_THRESHOLD;
}

export function quotationCoverIntro(intro: string) {
  const trimmed = intro.trim();
  if (!trimmed) {
    return "Dengan hormat,\nBersama ini kami sampaikan penawaran harga sesuai permintaan Bapak/Ibu.";
  }
  return trimmed
    .replace(/[,\s]*dengan rincian sebagai berikut:?\s*$/i, ".")
    .replace(/\s+sebagai berikut:?\s*$/i, ".");
}

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

export function latestQuotationForOrder(db: Database, orderId: string, kind: QuotationKind) {
  return db.quotations
    .filter((row) => row.orderId === orderId && row.kind === kind)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.date.localeCompare(a.date))[0] ?? null;
}

function lineToDraft(item: LineItem): DraftLine {
  return {
    key: item.id,
    productId: item.productId || "",
    name: item.name,
    spec: item.spec,
    qty: item.qty,
    unit: item.unit,
    unitPrice: item.unitPrice,
    costPrice: item.costPrice,
    sourceItemId: item.sourceItemId || item.id,
  };
}

function negotiatedMatch(orderItem: LineItem, ngs: Quotation, index: number, orderItemCount: number) {
  if (orderItem.productId) {
    const byProduct = ngs.items.find((item) => item.productId === orderItem.productId);
    if (byProduct) return byProduct;
  }
  const name = orderItem.name.trim().toLowerCase();
  if (name) {
    const byName = ngs.items.find((item) => item.name.trim().toLowerCase() === name);
    if (byName) return byName;
  }
  if (ngs.items.length === orderItemCount) return ngs.items[index] ?? null;
  return null;
}

export function invoiceDefaultsFromOrder(db: Database, order: Order) {
  const ngs = latestQuotationForOrder(db, order.id, "negosiasi");
  const items = order.items.map((item, index) => {
    const draft = lineToDraft(item);
    if (!ngs) return draft;
    const match = negotiatedMatch(item, ngs, index, order.items.length);
    return match ? { ...draft, unitPrice: match.unitPrice } : draft;
  });
  return {
    items,
    discount: ngs?.discount ?? 0,
    includePpn: ngs?.includePpn ?? true,
    ppnRate: ngs?.ppnRate ?? db.profile.defaultPpnRate,
    notes: order.notes || ngs?.notes || "",
    ngs,
  };
}

export type InvoicePriceMode = "net" | "negosiasi";

export type InvoiceOrderItemOption = {
  id: string;
  productId: string;
  name: string;
  spec: string;
  orderedQty: number;
  billedQty: number;
  remainingQty: number;
  unit: string;
  netPrice: number;
  ngsPrice: number | null;
  costPrice: number;
};

export type InvoiceOrderOption = {
  id: string;
  number: string;
  date: string;
  customerId: string;
  customerName: string;
  notes: string;
  invoiceCount: number;
  hasNgs: boolean;
  ngsNumber: string | null;
  ngsDiscount: number;
  ngsIncludePpn: boolean;
  ngsPpnRate: number;
  items: InvoiceOrderItemOption[];
};

function itemKey(item: Pick<LineItem, "productId" | "name" | "spec">) {
  return `${item.productId || ""}::${item.name.trim().toLowerCase()}::${item.spec.trim().toLowerCase()}`;
}

export function billedQtyByOrderItem(order: Order, invoices: Invoice[]) {
  const billed: Record<string, number> = Object.fromEntries(order.items.map((item) => [item.id, 0]));
  const pool = order.items.map((item) => ({
    id: item.id,
    key: itemKey(item),
    left: item.qty,
  }));

  for (const invoice of invoices) {
    if (invoice.status === "batal") continue;
    for (const item of invoice.items) {
      if (item.sourceItemId && billed[item.sourceItemId] != null) {
        billed[item.sourceItemId] += item.qty;
        const slot = pool.find((row) => row.id === item.sourceItemId);
        if (slot) slot.left = Math.max(0, slot.left - item.qty);
        continue;
      }
      const key = itemKey(item);
      const slot = pool.find((row) => row.left > 0 && row.key === key);
      if (!slot) continue;
      const take = Math.min(slot.left, item.qty);
      billed[slot.id] += take;
      slot.left -= take;
    }
  }

  return billed;
}

export function unitPriceForMode(item: InvoiceOrderItemOption, mode: InvoicePriceMode) {
  if (mode === "negosiasi") return item.ngsPrice ?? item.netPrice;
  return item.netPrice;
}

export function invoiceOrderOptions(db: Database): InvoiceOrderOption[] {
  return db.orders
    .filter((order) => order.status !== "dibatalkan")
    .map((order) => {
      const customer = db.customers.find((row) => row.id === order.customerId);
      const invoices = db.invoices.filter((row) => row.orderId === order.id);
      const billed = billedQtyByOrderItem(order, invoices);
      const ngs = latestQuotationForOrder(db, order.id, "negosiasi");
      return {
        id: order.id,
        number: order.number,
        date: order.date,
        customerId: order.customerId,
        customerName: customer?.name || "—",
        notes: order.notes || ngs?.notes || "",
        invoiceCount: invoices.length,
        hasNgs: Boolean(ngs),
        ngsNumber: ngs?.number || null,
        ngsDiscount: ngs?.discount ?? 0,
        ngsIncludePpn: ngs?.includePpn ?? true,
        ngsPpnRate: ngs?.ppnRate ?? db.profile.defaultPpnRate,
        items: order.items.map((item, index) => {
          const billedQty = billed[item.id] || 0;
          const match = ngs ? negotiatedMatch(item, ngs, index, order.items.length) : null;
          return {
            id: item.id,
            productId: item.productId || "",
            name: item.name,
            spec: item.spec,
            orderedQty: item.qty,
            billedQty,
            remainingQty: Math.max(0, item.qty - billedQty),
            unit: item.unit,
            netPrice: item.unitPrice,
            ngsPrice: match ? match.unitPrice : null,
            costPrice: item.costPrice,
          };
        }),
      };
    })
    .sort((a, b) => {
      const aOpen = a.items.some((item) => item.remainingQty > 0) ? 0 : 1;
      const bOpen = b.items.some((item) => item.remainingQty > 0) ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return b.date.localeCompare(a.date) || b.number.localeCompare(a.number);
    });
}
