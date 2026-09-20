import { notFound } from "next/navigation";
import { QuotationDocument } from "@/components/documents";
import { PrintToolbar } from "@/components/document-actions";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CetakPenawaranPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const quotation = db.quotations.find((row) => row.id === id);
  if (!quotation) notFound();
  const customer = db.customers.find((row) => row.id === quotation.customerId);
  if (!customer) notFound();
  const source = quotation.sourceId
    ? db.quotations.find((row) => row.id === quotation.sourceId)
    : null;

  return (
    <div className="min-h-full bg-stone-100 py-6 print:bg-white print:py-0">
      <PrintToolbar
        backHref={`/order/${quotation.orderId}`}
        pdfHref={`/api/pdf/penawaran/${quotation.id}`}
        printLabel="Cetak penawaran"
        pdfLabel="Unduh PDF"
      />
      <QuotationDocument
        profile={db.profile}
        customer={customer}
        quotation={quotation}
        sourceNumber={source?.number}
      />
    </div>
  );
}
