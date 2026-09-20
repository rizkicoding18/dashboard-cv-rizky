import { notFound } from "next/navigation";
import { InvoiceDocument } from "@/components/documents";
import { PrintToolbar } from "@/components/document-actions";
import { resolveBank } from "@/lib/banks";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CetakInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const invoice = db.invoices.find((row) => row.id === id);
  if (!invoice) notFound();
  const customer = db.customers.find((row) => row.id === invoice.customerId);
  if (!customer) notFound();

  return (
    <div className="min-h-full bg-stone-100 py-6 print:bg-white print:py-0">
      <PrintToolbar
        backHref={`/dokumen/invoice/${invoice.id}`}
        pdfHref={`/api/pdf/invoice/${invoice.id}`}
        printLabel="Cetak invoice"
        pdfLabel="Unduh PDF"
      />
      <InvoiceDocument
        profile={db.profile}
        customer={customer}
        invoice={invoice}
        bank={resolveBank(db, invoice.bankId)}
      />
    </div>
  );
}
