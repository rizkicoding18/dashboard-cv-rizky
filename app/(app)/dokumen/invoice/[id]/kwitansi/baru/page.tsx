import { notFound, redirect } from "next/navigation";
import { KwitansiForm } from "@/components/kwitansi-form";
import { ButtonLink, PageHeader } from "@/components/shared";
import { defaultReceiptFromInvoice } from "@/lib/docs";
import { invoiceTotal, isIssued } from "@/lib/finance";
import { readDb } from "@/lib/store";

export default async function InvoiceKwitansiBaruPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const { id } = await params;
  const { paymentId } = await searchParams;
  const db = await readDb();
  const invoice = db.invoices.find((row) => row.id === id);
  if (!invoice) notFound();
  if (!isIssued(invoice.status)) redirect(`/dokumen/invoice/${invoice.id}`);
  const customer = db.customers.find((row) => row.id === invoice.customerId);
  if (!customer) notFound();
  const payment = paymentId
    ? db.payments.find((row) => row.id === paymentId && row.invoiceId === invoice.id)
    : null;
  const draft = defaultReceiptFromInvoice(db, invoice, payment);

  return (
    <div>
      <PageHeader
        eyebrow={invoice.number}
        title="Kwitansi baru"
        description={`Tanda terima pembayaran dari ${customer.name}. Data diisi dari invoice, bisa disesuaikan.`}
        actions={
          <ButtonLink href={`/dokumen/invoice/${invoice.id}`} variant="outline">
            Kembali ke invoice
          </ButtonLink>
        }
      />
      <KwitansiForm
        invoiceId={invoice.id}
        invoiceNumber={invoice.number}
        customerName={customer.name}
        invoiceTotal={invoiceTotal(invoice)}
        paymentId={draft.paymentId}
        defaultDate={draft.date}
        defaultAmount={draft.amount}
        defaultMethod={draft.method}
        defaultBankId={draft.bankId}
        defaultDescription={draft.description}
        defaultNotes={draft.notes}
        banks={db.banks}
      />
    </div>
  );
}
