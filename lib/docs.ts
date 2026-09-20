import { createId, nextNumber } from "@/lib/ids";
import type { BeritaAcara, Customer, Database, Invoice } from "@/lib/types";

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
