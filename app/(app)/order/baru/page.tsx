import { OrderForm } from "@/components/order-form";
import { PageHeader } from "@/components/shared";
import { readDb } from "@/lib/store";

export default async function OrderBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const db = await readDb();
  return (
    <div>
      <PageHeader
        eyebrow="Produksi"
        title="Order baru"
        description="Pilih perusahaan dulu agar harga khusus langsung terisi. Surat penawaran harga dibuat otomatis dari item order."
      />
      <OrderForm
        customers={db.customers}
        products={db.products}
        prices={db.customerPrices}
        defaultCustomerId={customerId}
      />
    </div>
  );
}
