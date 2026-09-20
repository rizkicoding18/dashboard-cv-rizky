import { notFound, redirect } from "next/navigation";
import { QuotationForm } from "@/components/quotation-form";
import { ButtonLink, PageHeader } from "@/components/shared";
import { defaultQuotationCopy } from "@/lib/quotations";
import { readDb } from "@/lib/store";

export default async function SuratPenawaranBaruPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const order = db.orders.find((row) => row.id === id);
  if (!order) notFound();
  if (order.status === "dibatalkan") redirect(`/order/${order.id}`);
  const customer = db.customers.find((row) => row.id === order.customerId);
  if (!customer) notFound();
  const copy = defaultQuotationCopy("sph");

  return (
    <div>
      <PageHeader
        eyebrow={order.number}
        title="Surat penawaran harga"
        description={`Penawaran resmi untuk ${customer.name}. Harga bisa disesuaikan sebelum dikirim.`}
        actions={
          <ButtonLink href={`/order/${order.id}`} variant="outline">
            Kembali ke order
          </ButtonLink>
        }
      />
      <QuotationForm
        kind="sph"
        customers={db.customers}
        products={db.products}
        prices={db.customerPrices}
        defaultCustomerId={order.customerId}
        defaultOrderId={order.id}
        defaultItems={order.items.map((item) => ({
          key: item.id,
          productId: item.productId || "",
          name: item.name,
          spec: item.spec,
          qty: item.qty,
          unit: item.unit,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
        }))}
        defaultSubject={copy.subject}
        defaultIntro={copy.intro}
        defaultPpnRate={db.profile.defaultPpnRate}
      />
    </div>
  );
}
