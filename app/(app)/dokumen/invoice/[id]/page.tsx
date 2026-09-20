import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteInvoice, deleteSuratJalan, issueInvoice } from "@/app/actions";
import { DownloadPdfButton } from "@/components/document-actions";
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
  Table,
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/shared";
import { invoiceOutstanding, invoiceTotal, isIssued } from "@/lib/finance";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
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
  const ba = db.beritaAcaras.find((row) => row.invoiceId === invoice.id);
  const sjList = db.suratJalans.filter((row) => row.invoiceId === invoice.id);
  const issued = isIssued(invoice.status);
  const total = invoiceTotal(invoice);
  const outstanding = invoiceOutstanding(invoice);
  const docs = issued
    ? [
        {
          id: `invoice-${invoice.id}`,
          kind: "Invoice",
          number: invoice.number,
          date: invoice.date,
          printHref: `/cetak/invoice/${invoice.id}`,
          pdfHref: `/api/pdf/invoice/${invoice.id}`,
          deleteId: null as string | null,
        },
        {
          id: `faktur-${invoice.id}`,
          kind: "Faktur",
          number: invoice.fakturNumber || invoice.number,
          date: invoice.date,
          printHref: `/cetak/faktur/${invoice.id}`,
          pdfHref: `/api/pdf/faktur/${invoice.id}`,
          deleteId: null as string | null,
        },
        ...(ba
          ? [
              {
                id: ba.id,
                kind: "Berita acara",
                number: ba.number,
                date: ba.date,
                printHref: `/cetak/ba/${ba.id}`,
                pdfHref: `/api/pdf/ba/${ba.id}`,
                deleteId: null as string | null,
              },
            ]
          : []),
        ...sjList.map((sj) => ({
          id: sj.id,
          kind: "Surat jalan",
          number: sj.number,
          date: sj.date,
          printHref: `/cetak/sj/${sj.id}`,
          pdfHref: `/api/pdf/sj/${sj.id}`,
          deleteId: sj.id,
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
            ? "Cetak dokumen, catat pembayaran, dan buat surat jalan dari sini."
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
      </div>

      {issued ? (
        <>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="font-heading text-lg">Item ditagih</h2>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {invoice.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3">
                  <p className="font-medium">{item.name}</p>
                  {item.spec ? <p className="mt-1 text-xs text-muted-foreground">{item.spec}</p> : null}
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatNumber(item.qty)} {item.unit} × {formatRupiah(item.unitPrice)}
                    </span>
                    <span className="font-medium">{formatRupiah(item.qty * item.unitPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <Th>Item</Th>
                    <Th>Qty</Th>
                    <Th>Harga</Th>
                    <Th>Jumlah</Th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <Td>
                        {item.name}
                        {item.spec ? <p className="text-xs text-muted-foreground">{item.spec}</p> : null}
                      </Td>
                      <Td>
                        {formatNumber(item.qty)} {item.unit}
                      </Td>
                      <Td>{formatRupiah(item.unitPrice)}</Td>
                      <Td>{formatRupiah(item.qty * item.unitPrice)}</Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-lg">Dokumen</h2>
                <p className="text-sm text-muted-foreground">Invoice, faktur, BA, dan surat jalan dalam satu daftar.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={`/dokumen/invoice/${invoice.id}/sj/baru`} variant="outline" size="sm">
                  Surat jalan
                </ButtonLink>
                {!ba ? (
                  <ButtonLink href={`/dokumen/ba/baru?invoiceId=${invoice.id}`} variant="outline" size="sm">
                    Buat BA
                  </ButtonLink>
                ) : null}
              </div>
            </div>
            {docs.length === 0 ? (
              <EmptyState
                title="Belum ada dokumen"
                description="Terbitkan invoice untuk membuat faktur dan berita acara."
              />
            ) : (
              <>
                <div className="grid gap-3 p-4 md:hidden">
                  {docs.map((doc) => (
                    <div key={doc.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge tone="neutral">{doc.kind}</Badge>
                          <p className="mt-1 font-medium">{doc.number}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(doc.date)}</p>
                        </div>
                      </div>
                      <DocRowActions printHref={doc.printHref} pdfHref={doc.pdfHref} deleteId={doc.deleteId} />
                    </div>
                  ))}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <Th>Jenis</Th>
                        <Th>Nomor</Th>
                        <Th>Tanggal</Th>
                        <Th>Aksi</Th>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docs.map((doc) => (
                        <TableRow key={doc.id}>
                          <Td>
                            <Badge tone="neutral">{doc.kind}</Badge>
                          </Td>
                          <Td className="font-medium">{doc.number}</Td>
                          <Td>{formatDate(doc.date)}</Td>
                          <Td>
                            <DocRowActions printHref={doc.printHref} pdfHref={doc.pdfHref} deleteId={doc.deleteId} />
                          </Td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 font-heading text-lg">Pembayaran</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Total {formatRupiah(total)} · sisa {formatRupiah(outstanding)}
            </p>
            {invoice.status !== "lunas" ? <PaymentForm invoiceId={invoice.id} /> : null}
            {payments.length > 0 ? (
              <ul className="mt-4 grid gap-2 border-t border-border pt-4 text-sm">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex justify-between">
                    <span>
                      {payment.date} · {payment.method}
                    </span>
                    <span>{formatRupiah(payment.amount)}</span>
                  </li>
                ))}
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

function DocRowActions({
  printHref,
  pdfHref,
  deleteId,
}: {
  printHref: string;
  pdfHref: string;
  deleteId: string | null;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
      <ButtonLink href={printHref} variant="outline" size="sm">
        Cetak
      </ButtonLink>
      <DownloadPdfButton href={pdfHref} label="PDF" size="sm" />
      {deleteId ? (
        <ConfirmSubmit
          label="Hapus"
          message="Hapus surat jalan ini?"
          action={deleteSuratJalan.bind(null, deleteId)}
        />
      ) : null}
    </div>
  );
}
