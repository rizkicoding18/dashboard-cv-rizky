import { deleteInvoice } from "@/app/actions";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { InvoicesTable } from "@/components/tables/list-tables";
import { invoiceOutstanding, invoiceTotal } from "@/lib/finance";
import { formatDate, formatRupiah } from "@/lib/format";
import { readDb } from "@/lib/store";

export default async function DokumenPage() {
  const db = await readDb();
  const invoices = db.invoices.map((invoice) => {
    const customer = db.customers.find((row) => row.id === invoice.customerId);
    return {
      id: invoice.id,
      href: `/dokumen/invoice/${invoice.id}`,
      number: invoice.number,
      fakturNumber: invoice.fakturNumber,
      customer: customer?.name || "—",
      date: formatDate(invoice.date),
      total: formatRupiah(invoiceTotal(invoice)),
      outstanding: formatRupiah(invoiceOutstanding(invoice)),
      sjCount: String(db.suratJalans.filter((row) => row.invoiceId === invoice.id).length),
      status: invoice.status,
      deleteAction: deleteInvoice.bind(null, invoice.id) as () => Promise<unknown>,
      deleteMessage:
        invoice.status === "draft"
          ? "Hapus draft invoice ini?"
          : "Hapus invoice ini beserta faktur, BA, surat jalan, kwitansi, dan pembayaran terkait? Stok yang terpotong akan dikembalikan.",
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Dokumen"
        title="Invoice & faktur"
        description="Pilih order, lalu tagih sebagian atau seluruh item. Satu order bisa punya lebih dari satu invoice."
        actions={<ButtonLink href="/dokumen/invoice/baru">Buat invoice</ButtonLink>}
      />
      {invoices.length === 0 ? (
        <Card>
          <EmptyState title="Belum ada invoice" description="Buat invoice dari order atau langsung dari sini." />
        </Card>
      ) : (
        <InvoicesTable data={invoices} />
      )}
    </div>
  );
}
