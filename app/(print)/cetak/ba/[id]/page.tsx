import { notFound } from "next/navigation";
import { BeritaAcaraDocument } from "@/components/documents";
import { PrintToolbar } from "@/components/document-actions";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CetakBaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const ba = db.beritaAcaras.find((row) => row.id === id);
  if (!ba) notFound();
  const customer = db.customers.find((row) => row.id === ba.customerId);
  if (!customer) notFound();

  return (
    <div className="min-h-full bg-stone-100 py-6 print:bg-white print:py-0">
      <PrintToolbar
        backHref={`/dokumen/ba/${ba.id}`}
        pdfHref={`/api/pdf/ba/${ba.id}`}
        printLabel="Cetak berita acara"
        pdfLabel="Unduh PDF"
      />
      <BeritaAcaraDocument profile={db.profile} customer={customer} ba={ba} />
    </div>
  );
}
