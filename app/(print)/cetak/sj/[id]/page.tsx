import { notFound } from "next/navigation";
import { SuratJalanDocument } from "@/components/documents";
import { PrintToolbar } from "@/components/document-actions";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CetakSjPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const sj = db.suratJalans.find((row) => row.id === id);
  if (!sj) notFound();
  const customer = db.customers.find((row) => row.id === sj.customerId);
  if (!customer) notFound();

  return (
    <div className="min-h-full bg-stone-100 py-6 print:bg-white print:py-0">
      <PrintToolbar
        backHref={sj.invoiceId ? `/dokumen/invoice/${sj.invoiceId}` : "/dokumen"}
        pdfHref={`/api/pdf/sj/${sj.id}`}
        printLabel="Cetak surat jalan"
        pdfLabel="Unduh PDF"
      />
      <SuratJalanDocument profile={db.profile} customer={customer} sj={sj} />
    </div>
  );
}
