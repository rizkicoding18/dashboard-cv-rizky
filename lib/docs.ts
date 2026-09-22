import { createId, nextNumber } from "@/lib/ids";
import { invoiceTotal } from "@/lib/finance";
import { todayIso } from "@/lib/format";
import type { BeritaAcara, Customer, Database, Invoice, Payment, Receipt } from "@/lib/types";

export function assignFakturNumber(db: Database, invoice: Invoice) {
  if (invoice.fakturNumber) return invoice.fakturNumber;
  invoice.fakturNumber = nextNumber(
    "FKT",
    db.invoices.map((row) => row.fakturNumber).filter(Boolean),
  );
  return invoice.fakturNumber;
}

export function buildBeritaAcaraFromInvoice(db: Database, invoice: Invoice, customer?: Customer): BeritaAcara {
  return {
    id: createId("ba"),
    number: nextNumber(
      "BA",
      db.beritaAcaras.map((item) => item.number),
    ),
    invoiceId: invoice.id,
    orderId: invoice.orderId,
    customerId: invoice.customerId,
    date: invoice.date,
    location: customer?.name || "",
    title: "Berita Acara Serah Terima",
    description: "",
    items: invoice.items.map((item) => ({
      id: createId("ba_i"),
      name: item.name,
      spec: item.spec,
      qty: item.qty,
      unit: item.unit,
      condition: "Baik dan lengkap",
    })),
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

export function ensureInvoiceCompanions(db: Database, invoice: Invoice) {
  assignFakturNumber(db, invoice);
  if (db.beritaAcaras.some((row) => row.invoiceId === invoice.id)) return;
  const customer = db.customers.find((row) => row.id === invoice.customerId);
  db.beritaAcaras.unshift(buildBeritaAcaraFromInvoice(db, invoice, customer));
}

export function receiptDescriptionFromInvoice(invoice: Invoice) {
  const names = invoice.items.map((item) => item.name).filter(Boolean);
  const head = `Pembayaran invoice ${invoice.number}`;
  if (!names.length) return head;
  if (names.length === 1) return `${head} — ${names[0]}`;
  return `${head} — ${names[0]} dan ${names.length - 1} item lain`;
}

export function defaultReceiptFromInvoice(
  db: Database,
  invoice: Invoice,
  payment?: Payment | null,
): Omit<Receipt, "id" | "number" | "createdAt"> {
  const latestPayment =
    payment ||
    db.payments
      .filter((row) => row.invoiceId === invoice.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0] ||
    null;
  const amount = latestPayment?.amount || invoice.paidAmount || invoiceTotal(invoice);
  return {
    invoiceId: invoice.id,
    paymentId: latestPayment?.id || null,
    customerId: invoice.customerId,
    date: latestPayment?.date || todayIso(),
    amount,
    method: latestPayment?.method || "transfer",
    bankId: latestPayment?.bankId || invoice.bankId,
    description: receiptDescriptionFromInvoice(invoice),
    notes: latestPayment?.notes || "",
  };
}
