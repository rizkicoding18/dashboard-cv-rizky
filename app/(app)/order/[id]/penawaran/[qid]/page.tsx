import { notFound } from "next/navigation";
import { QuotationForm } from "@/components/quotation-form";
import { ButtonLink, PageHeader } from "@/components/shared";
import { QUOTATION_KIND_LABEL } from "@/lib/quotations";
import { readDb } from "@/lib/store";

export default async function UbahPenawaranPage({
  params,
}: {
  params: Promise<{ id: string; qid: string }>;
}) {
  const { id, qid } = await params;
  const db = await readDb();
  const order = db.orders.find((row) => row.id === id);
  const quotation = db.quotations.find((row) => row.id === qid && row.orderId === id);
  if (!order || !quotation) notFound();
  const source = quotation.sourceId
    ? db.quotations.find((row) => row.id === quotation.sourceId)
    : null;

  return (
    <div>
      <PageHeader
        eyebrow={quotation.number}
        title={`Ubah ${QUOTATION_KIND_LABEL[quotation.kind].toLowerCase()}`}
        description={source ? `Mengacu ${source.number}.` : `Dokumen penawaran untuk order ${order.number}.`}
        actions={
          <ButtonLink href={`/order/${order.id}`} variant="outline">
            Kembali ke order
          </ButtonLink>
        }
      />
      <QuotationForm
        kind={quotation.kind}
        customers={db.customers}
        products={db.products}
        prices={db.customerPrices}
        quotation={quotation}
        defaultCustomerId={order.customerId}
        defaultOrderId={order.id}
        defaultSubject={quotation.subject}
        defaultIntro={quotation.intro}
        defaultPpnRate={db.profile.defaultPpnRate}
      />
    </div>
  );
}
