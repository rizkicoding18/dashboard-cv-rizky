import { notFound } from "next/navigation";
import { deleteBeritaAcara } from "@/app/actions";
import { BeritaAcaraDocument } from "@/components/documents";
import { DocActions } from "@/components/document-actions";
import { ConfirmSubmit } from "@/components/line-items";
import { Card, PageHeader } from "@/components/shared";
import { readDb } from "@/lib/store";

export default async function BaDetailPage({
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
    <div className="grid gap-6">
      <PageHeader
        eyebrow={ba.number}
        title={ba.title}
        description={`Serah terima untuk ${customer.name}`}
        actions={
          <>
            <DocActions printHref={`/cetak/ba/${ba.id}`} pdfHref={`/api/pdf/ba/${ba.id}`} />
            <ConfirmSubmit
              label="Hapus"
              message="Hapus berita acara ini?"
              action={deleteBeritaAcara.bind(null, ba.id)}
            />
          </>
        }
      />
      <Card className="p-4">
        <BeritaAcaraDocument profile={db.profile} customer={customer} ba={ba} />
      </Card>
    </div>
  );
}
