import { notFound } from "next/navigation";
import { KwitansiDocument } from "@/components/documents";
import { PrintToolbar } from "@/components/document-actions";
import { resolveBank } from "@/lib/banks";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CetakKwitansiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const receipt = db.receipts.find((row) => row.id === id);
  if (!receipt) notFound();
  const customer = db.customers.find((row) => row.id === receipt.customerId);
  if (!customer) notFound();
  const invoice = db.invoices.find((row) => row.id === receipt.invoiceId);

  return (
    <div className="min-h-full bg-stone-100 py-6 print:bg-white print:py-0">
      <PrintToolbar
        backHref={`/dokumen/invoice/${receipt.invoiceId}`}
        pdfHref={`/api/pdf/kwitansi/${receipt.id}`}
        printLabel="Cetak kwitansi"
        pdfLabel="Unduh PDF"
      />
      <KwitansiDocument
        profile={db.profile}
        customer={customer}
        receipt={receipt}
        invoiceNumber={invoice?.number}
        bank={resolveBank(db, receipt.bankId)}
      />
    </div>
  );
}
