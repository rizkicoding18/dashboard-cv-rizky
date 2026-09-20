import { BeritaAcaraForm } from "@/components/ba-form";
import { PageHeader } from "@/components/shared";
import { readDb } from "@/lib/store";

export default async function BaBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string; orderId?: string }>;
}) {
  const { invoiceId, orderId } = await searchParams;
  const db = await readDb();
  const invoice = db.invoices.find((row) => row.id === invoiceId);
  const order = db.orders.find((row) => row.id === orderId);
  const source = invoice || order;

  return (
    <div>
      <PageHeader
        eyebrow="Dokumen"
        title="Berita acara baru"
        description="Pakai untuk serah terima pekerjaan percetakan atau pengadaan barang."
      />
      <BeritaAcaraForm
        customers={db.customers}
        defaultCustomerId={source?.customerId}
        defaultInvoiceId={invoice?.id || null}
        defaultOrderId={order?.id || invoice?.orderId || null}
        defaultItems={source?.items.map((item) => ({
          key: item.id,
          name: item.name,
          spec: item.spec,
          qty: item.qty,
          unit: item.unit,
          condition: "Baik dan lengkap",
        }))}
        defaultTitle="Berita Acara Serah Terima"
        defaultDescription=""
      />
    </div>
  );
}
