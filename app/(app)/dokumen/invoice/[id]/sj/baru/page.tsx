import { notFound, redirect } from "next/navigation";
import { SuratJalanForm } from "@/components/sj-form";
import { ButtonLink, PageHeader } from "@/components/shared";
import { isIssued } from "@/lib/finance";
import { readDb } from "@/lib/store";

export default async function InvoiceSuratJalanBaruPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const invoice = db.invoices.find((row) => row.id === id);
  if (!invoice) notFound();
  if (!isIssued(invoice.status)) redirect(`/dokumen/invoice/${invoice.id}`);
  const customer = db.customers.find((row) => row.id === invoice.customerId);
  if (!customer) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={invoice.number}
        title="Surat jalan baru"
        description={`Pengiriman untuk ${customer.name}. Bisa dibuat beberapa kali jika barang dikirim bertahap.`}
        actions={
          <ButtonLink href={`/dokumen/invoice/${invoice.id}`} variant="outline">
            Kembali ke invoice
          </ButtonLink>
        }
      />
      <SuratJalanForm
        customers={db.customers}
        defaultCustomerId={invoice.customerId}
        defaultInvoiceId={invoice.id}
        defaultOrderId={invoice.orderId}
        defaultDestination={customer.address}
        lockCustomer
        defaultItems={invoice.items.map((item) => ({
          key: item.id,
          name: item.name,
          spec: item.spec,
          qty: item.qty,
          unit: item.unit,
          notes: "",
        }))}
      />
    </div>
  );
}
