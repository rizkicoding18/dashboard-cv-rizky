import { notFound, redirect } from "next/navigation";
import { QuotationForm } from "@/components/quotation-form";
import { ButtonLink, PageHeader } from "@/components/shared";
import { defaultQuotationCopy } from "@/lib/quotations";
import { readDb } from "@/lib/store";

export default async function PenawaranNegosiasiBaruPage({
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
  const source = db.quotations.find((row) => row.orderId === order.id && row.kind === "sph");
  const sourceItems = source?.items || order.items;
  const copy = defaultQuotationCopy("negosiasi", source?.number);

  return (
    <div>
      <PageHeader
        eyebrow={order.number}
        title="Penawaran harga negosiasi"
        description={
          source
            ? `Harga awal dari ${source.number}. Ubah angka yang sudah disepakati.`
            : `Belum ada surat penawaran. Form terisi dari order ${order.number}.`
        }
        actions={
          <ButtonLink href={`/order/${order.id}`} variant="outline">
            Kembali ke order
          </ButtonLink>
        }
      />
      <QuotationForm
        kind="negosiasi"
        customers={db.customers}
        products={db.products}
        prices={db.customerPrices}
        defaultCustomerId={order.customerId}
        defaultOrderId={order.id}
        defaultSourceId={source?.id || null}
        defaultItems={sourceItems.map((item) => ({
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
