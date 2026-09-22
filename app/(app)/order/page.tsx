import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { OrdersTable } from "@/components/tables/list-tables";
import { formatDate, formatRupiah } from "@/lib/format";
import { invoiceSubtotal } from "@/lib/finance";
import { needsTaxInvoice } from "@/lib/file-meta";
import { readDb } from "@/lib/store";

export default async function OrderPage() {
  const db = await readDb();
  const data = db.orders.map((order) => {
    const customer = db.customers.find((row) => row.id === order.customerId);
    const subtotal = invoiceSubtotal(order.items);
    return {
      id: order.id,
      href: `/order/${order.id}`,
      number: order.number,
      customer: customer?.name || "—",
      date: formatDate(order.date),
      amount: formatRupiah(subtotal),
      status: order.status,
      taxMissing: needsTaxInvoice(subtotal) && !order.taxInvoice,
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Produksi"
        title="Order masuk"
        description="Catat permintaan perusahaan. Surat penawaran harga dibuat otomatis, lalu lanjut invoice jika disetujui."
        actions={<ButtonLink href="/order/baru">Order baru</ButtonLink>}
      />
      {data.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada order"
            description="Order masuk bisa berisi item katalog atau pekerjaan custom."
            action={<ButtonLink href="/order/baru">Buat order</ButtonLink>}
          />
        </Card>
      ) : (
        <OrdersTable data={data} />
      )}
    </div>
  );
}
