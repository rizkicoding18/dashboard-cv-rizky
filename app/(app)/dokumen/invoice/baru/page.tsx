import { InvoiceForm } from "@/components/invoice-form";
import { PageHeader } from "@/components/shared";
import { readDb } from "@/lib/store";

export default async function InvoiceBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; customerId?: string }>;
}) {
  const { orderId, customerId } = await searchParams;
  const db = await readDb();
  const order = db.orders.find((row) => row.id === orderId);
  const defaultItems = order?.items.map((item) => ({
    key: item.id,
    productId: item.productId || "",
    name: item.name,
    spec: item.spec,
    qty: item.qty,
    unit: item.unit,
    unitPrice: item.unitPrice,
    costPrice: item.costPrice,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Dokumen"
        title="Invoice baru"
        description={
          order
            ? `Dari order ${order.number}. Saat diterbitkan, faktur dan berita acara ikut dibuat.`
            : "Saat invoice diterbitkan, faktur penjualan dan berita acara dibuat otomatis."
        }
      />
      <InvoiceForm
        customers={db.customers}
        products={db.products}
        prices={db.customerPrices}
        banks={db.banks}
        defaultCustomerId={order?.customerId || customerId}
        defaultOrderId={order?.id || null}
        defaultItems={defaultItems}
        defaultPpnRate={db.profile.defaultPpnRate}
      />
    </div>
  );
}
