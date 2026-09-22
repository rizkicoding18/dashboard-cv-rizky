import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteOrder, deleteQuotation, removeOrderSpk, updateOrderStatus, uploadOrderSpk } from "@/app/actions";
import { CompactFileUpload } from "@/components/file-uploads";
import { ConfirmSubmit, StatusButtons } from "@/components/line-items";
import { OrderForm } from "@/components/order-form";
import { OrderBadge } from "@/components/status";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { DocumentsTable, LineItemsTable } from "@/components/tables/detail-tables";
import { invoiceDpp, invoicePpn, invoiceSubtotal, isIssued } from "@/lib/finance";
import { filePublicUrl, needsTaxInvoice, uploadAccept } from "@/lib/file-meta";
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
  const hubInvoice = issuedInvoice || invoices[0];
  const quotations = db.quotations.filter((row) => row.orderId === order.id);
  const hasSph = quotations.some((row) => row.kind === "sph");
  const canQuote = order.status !== "dibatalkan";
  const canDeleteOrder =
    invoices.length === 0 &&
    !db.suratJalans.some((row) => row.orderId === order.id) &&
    !db.beritaAcaras.some((row) => row.orderId === order.id);
  const subtotal = invoiceSubtotal(order.items);
  const taxMissing = needsTaxInvoice(subtotal) && !order.taxInvoice;
  const docs = [
    ...quotations.map((quotation) => ({
      id: quotation.id,
      kind: QUOTATION_KIND_LABEL[quotation.kind],
      number: quotation.number,
      date: quotation.date,
      amount: invoiceDpp(quotation) + invoicePpn(quotation),
      openHref: `/order/${order.id}/penawaran/${quotation.id}`,
      openExternal: false,
      printHref: `/cetak/penawaran/${quotation.id}` as string | null,
      pdfHref: `/api/pdf/penawaran/${quotation.id}` as string | null,
      deleteAction: deleteQuotation.bind(null, quotation.id) as (() => Promise<unknown>) | null,
      deleteMessage: "Hapus penawaran ini?",
    })),
    ...(order.spk
      ? [
          {
            id: order.spk.id,
            kind: "SPK",
            number: order.spk.name,
            date: order.spk.uploadedAt,
            amount: null as number | null,
            openHref: filePublicUrl(order.spk),
            openExternal: true,
            printHref: null,
            pdfHref: order.spk.name.toLowerCase().endsWith(".pdf") ? filePublicUrl(order.spk) : null,
            deleteAction: removeOrderSpk.bind(null, order.id) as (() => Promise<unknown>) | null,
            deleteMessage: "Hapus SPK ini?",
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={order.number}
        title={customer?.name || "Order"}
        description={order.notes || "Kelola item, surat penawaran, dan SPK dari satu halaman."}
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
        <span className="font-medium">{formatRupiah(subtotal)}</span>
        <span className="text-muted-foreground">{order.items.length} item</span>
        {hubInvoice ? (
          <Link href={`/dokumen/invoice/${hubInvoice.id}`} className="text-primary">
            {issuedInvoice ? "Lihat invoice" : "Lihat draft invoice"}
          </Link>
        ) : canQuote ? (
          <Link href={`/dokumen/invoice/baru?orderId=${order.id}`} className="text-primary">
            Buat invoice
          </Link>
        ) : null}
        {taxMissing ? <Badge tone="warn">Faktur pajak</Badge> : null}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="font-heading text-lg">Item pesanan</h2>
        </div>
        <LineItemsTable
          data={order.items.map((item) => ({
            id: item.id,
            name: item.name,
            spec: item.spec || "",
            qty: `${formatNumber(item.qty)} ${item.unit}`,
            price: formatRupiah(item.unitPrice),
            amount: formatRupiah(item.qty * item.unitPrice),
          }))}
        />
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

      <Card>
        <div className="grid gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-heading text-lg">Dokumen</h2>
            <p className="text-sm text-muted-foreground">
              Surat penawaran dan SPK. Invoice, BA, surat jalan, dan faktur pajak ada di halaman invoice.
            </p>
          </div>
          {canQuote ? (
            <div className="flex flex-wrap items-center gap-2">
              {hasSph ? null : (
                <ButtonLink href={`/order/${order.id}/penawaran/baru`} variant="outline" size="sm">
                  Penawaran
                </ButtonLink>
              )}
              <ButtonLink href={`/order/${order.id}/penawaran/negosiasi`} variant="outline" size="sm">
                Negosiasi
              </ButtonLink>
              <CompactFileUpload
                action={uploadOrderSpk.bind(null, order.id)}
                accept={uploadAccept("spk")}
                folder={`orders/${order.id}/spk`}
                kind="spk"
                label={order.spk ? "Ganti SPK" : "SPK"}
              />
            </div>
          ) : null}
        </div>
        {docs.length === 0 ? (
          <EmptyState
            title="Belum ada dokumen"
            description="Surat penawaran harga dibuat otomatis saat order masuk. Unggah SPK jika sudah ada."
            action={
              canQuote ? (
                <ButtonLink href={`/order/${order.id}/penawaran/baru`}>Buat surat penawaran</ButtonLink>
              ) : null
            }
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
    </div>
  );
}
