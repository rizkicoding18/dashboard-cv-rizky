import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteInvoice, deleteReceipt, deleteSuratJalan, issueInvoice, removeOrderTaxInvoice, uploadOrderTaxInvoice } from "@/app/actions";
import { CompactFileUpload } from "@/components/file-uploads";
import { InvoiceForm } from "@/components/invoice-form";
import { ConfirmSubmit } from "@/components/line-items";
import { PaymentForm } from "@/components/money-forms";
import { InvoiceBadge } from "@/components/status";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { DocumentsTable, LineItemsTable } from "@/components/tables/detail-tables";
import { formatBankOption } from "@/lib/banks";
import { PAYMENT_METHOD_LABEL } from "@/lib/labels";
import { invoiceDpp, invoiceOutstanding, invoicePpn, invoiceSubtotal, invoiceTotal, isIssued } from "@/lib/finance";
import { filePublicUrl, needsTaxInvoice, uploadAccept } from "@/lib/file-meta";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { payrollTotal } from "@/lib/payroll";
import { readDb } from "@/lib/store";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const invoice = db.invoices.find((row) => row.id === id);
  if (!invoice) notFound();
  const customer = db.customers.find((row) => row.id === invoice.customerId);
  if (!customer) notFound();
  const payments = db.payments.filter((row) => row.invoiceId === invoice.id);
  const receipts = (db.receipts ?? []).filter((row) => row.invoiceId === invoice.id);
  const ba = db.beritaAcaras.find((row) => row.invoiceId === invoice.id);
  const sjList = db.suratJalans.filter((row) => row.invoiceId === invoice.id);
  const order = invoice.orderId ? db.orders.find((row) => row.id === invoice.orderId) : null;
  const payrolls = order ? db.payrolls.filter((row) => row.orderId === order.id) : [];
  const issued = isIssued(invoice.status);
  const total = invoiceTotal(invoice);
  const outstanding = invoiceOutstanding(invoice);
  const taxBase = order ? invoiceSubtotal(order.items) : total;
  const taxMissing = Boolean(order && needsTaxInvoice(taxBase) && !order.taxInvoice);
  const invoiceAmount = invoiceDpp(invoice) + invoicePpn(invoice);
  const docs = issued
    ? [
        {
          id: `invoice-${invoice.id}`,
          kind: "Invoice",
          number: invoice.number,
          date: invoice.date,
          amount: invoiceAmount,
          printHref: `/cetak/invoice/${invoice.id}` as string | null,
          pdfHref: `/api/pdf/invoice/${invoice.id}` as string | null,
          openHref: null as string | null,
          openExternal: false,
          deleteAction: null as (() => Promise<unknown>) | null,
          deleteMessage: "",
        },
        {
          id: `faktur-${invoice.id}`,
          kind: "Faktur",
          number: invoice.fakturNumber || invoice.number,
          date: invoice.date,
          amount: invoiceAmount,
          printHref: `/cetak/faktur/${invoice.id}` as string | null,
          pdfHref: `/api/pdf/faktur/${invoice.id}` as string | null,
          openHref: null,
          openExternal: false,
          deleteAction: null,
          deleteMessage: "",
        },
        ...(order?.taxInvoice
          ? [
              {
                id: order.taxInvoice.id,
                kind: "Faktur pajak",
                number: order.taxInvoice.name,
                date: order.taxInvoice.uploadedAt,
                amount: null as number | null,
                printHref: null,
                pdfHref: order.taxInvoice.name.toLowerCase().endsWith(".pdf")
                  ? filePublicUrl(order.taxInvoice)
                  : null,
                openHref: filePublicUrl(order.taxInvoice),
                openExternal: true,
                deleteAction: removeOrderTaxInvoice.bind(null, order.id) as (() => Promise<unknown>) | null,
                deleteMessage: "Hapus faktur pajak ini?",
              },
            ]
          : []),
        ...(ba
          ? [
              {
                id: ba.id,
                kind: "Berita acara",
                number: ba.number,
                date: ba.date,
                amount: null as number | null,
                printHref: `/cetak/ba/${ba.id}` as string | null,
                pdfHref: `/api/pdf/ba/${ba.id}` as string | null,
                openHref: `/dokumen/ba/${ba.id}` as string | null,
                openExternal: false,
                deleteAction: null,
                deleteMessage: "",
              },
            ]
          : []),
        ...sjList.map((sj) => ({
          id: sj.id,
          kind: "Surat jalan",
          number: sj.number,
          date: sj.date,
          amount: null as number | null,
          printHref: `/cetak/sj/${sj.id}` as string | null,
          pdfHref: `/api/pdf/sj/${sj.id}` as string | null,
          openHref: null as string | null,
          openExternal: false,
          deleteAction: deleteSuratJalan.bind(null, sj.id) as (() => Promise<unknown>) | null,
          deleteMessage: "Hapus surat jalan ini?",
        })),
        ...receipts.map((receipt) => ({
          id: receipt.id,
          kind: "Kwitansi",
          number: receipt.number,
          date: receipt.date,
          amount: receipt.amount,
          printHref: `/cetak/kwitansi/${receipt.id}` as string | null,
          pdfHref: `/api/pdf/kwitansi/${receipt.id}` as string | null,
          openHref: null as string | null,
          openExternal: false,
          deleteAction: deleteReceipt.bind(null, receipt.id) as (() => Promise<unknown>) | null,
          deleteMessage: "Hapus kwitansi ini?",
        })),
        ...payrolls.map((payroll) => ({
          id: payroll.id,
          kind: "Penggajian",
          number: payroll.number,
          date: payroll.date,
          amount: payrollTotal(payroll),
          printHref: `/cetak/gaji/${payroll.id}` as string | null,
          pdfHref: `/api/pdf/gaji/${payroll.id}` as string | null,
          openHref: `/gaji/${payroll.id}` as string | null,
          openExternal: false,
          deleteAction: null as (() => Promise<unknown>) | null,
          deleteMessage: "",
        })),
      ]
    : [];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={invoice.number}
        title={customer.name}
        description={
          invoice.notes ||
          (issued
            ? "Cetak dokumen, catat pembayaran, dan buat surat jalan atau kwitansi dari sini."
            : "Periksa item, lalu terbitkan. Faktur dan berita acara dibuat otomatis.")
        }
        actions={
          <>
            <InvoiceBadge status={invoice.status} />
            {invoice.status === "draft" ? (
              <>
                <ConfirmSubmit
                  label="Terbitkan"
                  message="Terbitkan invoice ini? Stok dipotong, faktur dan berita acara dibuat otomatis."
                  variant="outline"
                  action={issueInvoice.bind(null, invoice.id)}
                />
                <ConfirmSubmit
                  label="Hapus draft"
                  message="Hapus draft invoice?"
                  action={deleteInvoice.bind(null, invoice.id)}
                />
              </>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">{formatDate(invoice.date)}</span>
        {invoice.dueDate ? <span className="text-muted-foreground">Jatuh tempo {formatDate(invoice.dueDate)}</span> : null}
        <span className="font-medium">{formatRupiah(total)}</span>
        {issued ? (
          <span className="text-muted-foreground">
            Sisa {formatRupiah(outstanding)}
          </span>
        ) : null}
        {invoice.orderId ? (
          <Link href={`/order/${invoice.orderId}`} className="text-primary">
            Lihat order
          </Link>
        ) : null}
        {taxMissing ? <Badge tone="warn">Faktur pajak</Badge> : null}
      </div>

      {issued ? (
        <>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="font-heading text-lg">Item ditagih</h2>
            </div>
            <LineItemsTable
              data={invoice.items.map((item) => ({
                id: item.id,
                name: item.name,
                spec: item.spec || "",
                qty: `${formatNumber(item.qty)} ${item.unit}`,
                price: formatRupiah(item.unitPrice),
                amount: formatRupiah(item.qty * item.unitPrice),
              }))}
            />
          </Card>

          <Card>
            <div className="grid gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="font-heading text-lg">Dokumen</h2>
                <p className="text-sm text-muted-foreground">
                  Invoice, faktur, faktur pajak, BA, surat jalan, kwitansi, dan penggajian.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ButtonLink href={`/dokumen/invoice/${invoice.id}/sj/baru`} variant="outline" size="sm">
                  Surat jalan
                </ButtonLink>
                <ButtonLink href={`/dokumen/invoice/${invoice.id}/kwitansi/baru`} variant="outline" size="sm">
                  Buat kwitansi
                </ButtonLink>
                {!ba ? (
                  <ButtonLink href={`/dokumen/ba/baru?invoiceId=${invoice.id}`} variant="outline" size="sm">
                    Buat BA
                  </ButtonLink>
                ) : null}
                {order ? (
                  <>
                    <ButtonLink href={`/gaji/baru?orderId=${order.id}`} variant="outline" size="sm">
                      Upah / nota
                    </ButtonLink>
                    <CompactFileUpload
                      action={uploadOrderTaxInvoice.bind(null, order.id)}
                      accept={uploadAccept("tax")}
                      folder={`orders/${order.id}/tax`}
                      kind="tax"
                      label={order.taxInvoice ? "Ganti faktur pajak" : "Faktur pajak"}
                    />
                  </>
                ) : null}
              </div>
            </div>
            {docs.length === 0 ? (
              <EmptyState
                title="Belum ada dokumen"
                description="Terbitkan invoice untuk membuat faktur dan berita acara."
              />
            ) : (
              <div className="py-4">
                <DocumentsTable
                  data={docs.map((doc) => ({
                    ...doc,
                    date: formatDate(doc.date),
                    amount: doc.amount != null ? formatRupiah(doc.amount) : "—",
                  }))}
                />
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 font-heading text-lg">Pembayaran</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Total {formatRupiah(total)} · sisa {formatRupiah(outstanding)}
            </p>
            {invoice.status !== "lunas" ? (
              <PaymentForm
                invoiceId={invoice.id}
                banks={db.banks}
                defaultBankId={invoice.bankId}
              />
            ) : null}
            {payments.length > 0 ? (
              <ul className="mt-4 grid gap-3 border-t border-border pt-4 text-sm">
                {payments.map((payment) => {
                  const bank = db.banks.find((row) => row.id === payment.bankId);
                  const proofHref = payment.proof ? filePublicUrl(payment.proof) : null;
                  return (
                    <li key={payment.id} className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p>
                          {formatDate(payment.date)} · {PAYMENT_METHOD_LABEL[payment.method]}
                        </p>
                        {bank ? (
                          <p className="mt-0.5 text-muted-foreground">{formatBankOption(bank)}</p>
                        ) : null}
                        {payment.notes ? (
                          <p className="mt-0.5 text-muted-foreground">{payment.notes}</p>
                        ) : null}
                        {proofHref ? (
                          <a
                            href={proofHref}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block font-medium text-primary"
                          >
                            Bukti: {payment.proof?.name}
                          </a>
                        ) : null}
                        <Link
                          href={`/dokumen/invoice/${invoice.id}/kwitansi/baru?paymentId=${payment.id}`}
                          className="mt-1 block text-sm font-medium text-primary"
                        >
                          Buat kwitansi
                        </Link>
                      </div>
                      <span className="shrink-0 font-medium">{formatRupiah(payment.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : invoice.status === "lunas" ? (
              <p className="text-sm text-muted-foreground">Sudah lunas.</p>
            ) : null}
          </Card>
        </>
      ) : (
        <InvoiceForm
          customers={db.customers}
          products={db.products}
          prices={db.customerPrices}
          banks={db.banks}
          invoice={invoice}
          defaultPpnRate={db.profile.defaultPpnRate}
        />
      )}
    </div>
  );
}
