import { notFound } from "next/navigation";
import { FakturDocument } from "@/components/documents";
import { PrintToolbar } from "@/components/document-actions";
import { resolveBank } from "@/lib/banks";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CetakFakturPage({
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
        pdfHref={`/api/pdf/faktur/${invoice.id}`}
        printLabel="Cetak faktur"
        pdfLabel="Unduh PDF"
      />
      <FakturDocument
        profile={db.profile}
        customer={customer}
        invoice={invoice}
        bank={resolveBank(db, invoice.bankId)}
      />
    </div>
  );
}
