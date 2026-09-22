import { InvoiceForm } from "@/components/invoice-form";
import { PageHeader } from "@/components/shared";
import { invoiceOrderOptions } from "@/lib/quotations";
import { readDb } from "@/lib/store";

export default async function InvoiceBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const db = await readDb();
  const orders = invoiceOrderOptions(db);
  const order = orders.find((row) => row.id === orderId);

  return (
    <div>
      <PageHeader
        eyebrow="Dokumen"
        title="Invoice baru"
        description={
          order
            ? `Dari ${order.number} — ${order.customerName}. Pilih item yang ditagih sekarang; sisanya bisa masuk invoice berikutnya.`
            : "Pilih order, tentukan harga net atau negosiasi, lalu klik item yang akan ditagih. Satu order bisa dipecah ke beberapa invoice."
        }
      />
      <InvoiceForm
        customers={db.customers}
        products={db.products}
        prices={db.customerPrices}
        banks={db.banks}
        orders={orders}
        defaultOrderId={order?.id}
        defaultPpnRate={db.profile.defaultPpnRate}
      />
    </div>
  );
}
