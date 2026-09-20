import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteOrder, deleteQuotation, updateOrderStatus } from "@/app/actions";
import { DownloadPdfButton } from "@/components/document-actions";
import { ConfirmSubmit, StatusButtons } from "@/components/line-items";
import { OrderForm } from "@/components/order-form";
import { OrderBadge } from "@/components/status";
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
import { invoiceDpp, invoicePpn, invoiceSubtotal, isIssued } from "@/lib/finance";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/labels";
import { QUOTATION_KIND_LABEL } from "@/lib/quotations";
import { readDb } from "@/lib/store";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const order = db.orders.find((row) => row.id === id);
  if (!order) notFound();
  const customer = db.customers.find((row) => row.id === order.customerId);
  const invoices = db.invoices.filter((row) => row.orderId === order.id);
  const issuedInvoice = invoices.find((row) => isIssued(row.status));
  const bas = db.beritaAcaras.filter((row) => row.orderId === order.id);
  const suratJalans = db.suratJalans.filter((row) => row.orderId === order.id);
  const quotations = db.quotations.filter((row) => row.orderId === order.id);
  const hasSph = quotations.some((row) => row.kind === "sph");
  const canQuote = order.status !== "dibatalkan";
  const canDeleteOrder = invoices.length === 0 && suratJalans.length === 0 && bas.length === 0;
  const docs = [
    ...quotations.map((quotation) => ({
      id: quotation.id,
      kind: QUOTATION_KIND_LABEL[quotation.kind],
      number: quotation.number,
      date: quotation.date,
      amount: invoiceDpp(quotation) + invoicePpn(quotation),
      openHref: `/order/${order.id}/penawaran/${quotation.id}`,
      printHref: `/cetak/penawaran/${quotation.id}`,
      pdfHref: `/api/pdf/penawaran/${quotation.id}`,
      deleteId: quotation.id,
    })),
    ...invoices.map((invoice) => ({
      id: invoice.id,
      kind: "Invoice",
      number: invoice.number,
      date: invoice.date,
      amount: invoiceDpp(invoice) + invoicePpn(invoice),
      openHref: `/dokumen/invoice/${invoice.id}`,
      printHref: `/cetak/invoice/${invoice.id}`,
      pdfHref: `/api/pdf/invoice/${invoice.id}`,
      deleteId: null as string | null,
    })),
    ...bas.map((ba) => ({
      id: ba.id,
      kind: "Berita acara",
      number: ba.number,
      date: ba.date,
      amount: null as number | null,
      openHref: `/dokumen/ba/${ba.id}`,
      printHref: `/cetak/ba/${ba.id}`,
      pdfHref: `/api/pdf/ba/${ba.id}`,
      deleteId: null as string | null,
    })),
    ...suratJalans.map((sj) => ({
      id: sj.id,
      kind: "Surat jalan",
      number: sj.number,
      date: sj.date,
      amount: null as number | null,
      openHref: sj.invoiceId
        ? `/dokumen/invoice/${sj.invoiceId}`
        : `/dokumen/invoice/${issuedInvoice?.id || invoices[0]?.id}`,
      printHref: `/cetak/sj/${sj.id}`,
      pdfHref: `/api/pdf/sj/${sj.id}`,
      deleteId: null as string | null,
    })),
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={order.number}
        title={customer?.name || "Order"}
        description={order.notes || "Kelola item, penawaran, invoice, dan dokumen kirim dari satu halaman."}
        actions={
          <>
            <StatusButtons
              current={order.status}
              options={Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label }))}
              action={updateOrderStatus.bind(null, order.id) as (value: string) => Promise<unknown>}
            />
            {canDeleteOrder ? (
              <ConfirmSubmit
                label="Hapus"
                message="Hapus order ini beserta surat penawarannya?"
                action={deleteOrder.bind(null, order.id)}
              />
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <OrderBadge status={order.status} />
        <span className="text-muted-foreground">Masuk {formatDate(order.date)}</span>
        {order.dueDate ? <span className="text-muted-foreground">Deadline {formatDate(order.dueDate)}</span> : null}
        <span className="font-medium">{formatRupiah(invoiceSubtotal(order.items))}</span>
        <span className="text-muted-foreground">{order.items.length} item</span>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="font-heading text-lg">Item pesanan</h2>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {order.items.map((item) => (
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
              {order.items.map((item) => (
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
        {order.status !== "dibatalkan" ? (
          <details className="border-t border-border">
            <summary className="cursor-pointer list-none px-5 py-3 text-sm font-medium text-primary marker:content-none [&::-webkit-details-marker]:hidden">
              Ubah item & catatan
            </summary>
            <div className="border-t border-border px-5 py-5">
              <OrderForm customers={db.customers} products={db.products} prices={db.customerPrices} order={order} />
            </div>
          </details>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg">Dokumen</h2>
            <p className="text-sm text-muted-foreground">
              Surat penawaran harga dibuat otomatis. Negosiasi dan invoice menyusul jika perlu.
            </p>
          </div>
          {canQuote ? (
            <div className="flex flex-wrap gap-2">
              {hasSph ? null : (
                <ButtonLink href={`/order/${order.id}/penawaran/baru`} variant="outline" size="sm">
                  Penawaran
                </ButtonLink>
              )}
              <ButtonLink href={`/order/${order.id}/penawaran/negosiasi`} variant="outline" size="sm">
                Negosiasi
              </ButtonLink>
              <ButtonLink href={`/dokumen/invoice/baru?orderId=${order.id}`} variant="outline" size="sm">
                Invoice
              </ButtonLink>
              <ButtonLink href={`/dokumen/ba/baru?orderId=${order.id}`} variant="outline" size="sm">
                BA
              </ButtonLink>
              {issuedInvoice ? (
                <ButtonLink href={`/dokumen/invoice/${issuedInvoice.id}/sj/baru`} variant="outline" size="sm">
                  Surat jalan
                </ButtonLink>
              ) : null}
            </div>
          ) : null}
        </div>
        {docs.length === 0 ? (
          <EmptyState
            title="Belum ada dokumen"
            description="Surat penawaran harga dibuat otomatis saat order masuk."
            action={
              canQuote ? (
                <ButtonLink href={`/order/${order.id}/penawaran/baru`}>Buat surat penawaran</ButtonLink>
              ) : null
            }
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
                    {doc.amount != null ? (
                      <span className="text-sm font-medium">{formatRupiah(doc.amount)}</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {doc.openHref ? (
                      <ButtonLink href={doc.openHref} variant="outline" size="sm">
                        Buka
                      </ButtonLink>
                    ) : null}
                    {doc.printHref ? (
                      <ButtonLink href={doc.printHref} variant="outline" size="sm">
                        Cetak
                      </ButtonLink>
                    ) : null}
                    {doc.pdfHref ? <DownloadPdfButton href={doc.pdfHref} label="PDF" size="sm" /> : null}
                    {doc.deleteId ? (
                      <ConfirmSubmit
                        label="Hapus"
                        message="Hapus penawaran ini?"
                        action={deleteQuotation.bind(null, doc.deleteId)}
                      />
                    ) : null}
                  </div>
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
                    <Th>Nilai</Th>
                    <Th>Aksi</Th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => (
                    <TableRow key={doc.id}>
                      <Td>
                        <Badge tone="neutral">{doc.kind}</Badge>
                      </Td>
                      <Td>
                        {doc.openHref ? (
                          <Link href={doc.openHref} className="font-medium text-primary">
                            {doc.number}
                          </Link>
                        ) : (
                          doc.number
                        )}
                      </Td>
                      <Td>{formatDate(doc.date)}</Td>
                      <Td>{doc.amount != null ? formatRupiah(doc.amount) : "—"}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          {doc.printHref ? (
                            <ButtonLink href={doc.printHref} variant="outline" size="sm">
                              Cetak
                            </ButtonLink>
                          ) : null}
                          {doc.pdfHref ? <DownloadPdfButton href={doc.pdfHref} label="PDF" size="sm" /> : null}
                          {doc.deleteId ? (
                            <ConfirmSubmit
                              label="Hapus"
                              message="Hapus penawaran ini?"
                              action={deleteQuotation.bind(null, doc.deleteId)}
                            />
                          ) : null}
                        </div>
                      </Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
