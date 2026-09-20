import Link from "next/link";
import {
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
import { InvoiceBadge } from "@/components/status";
import { invoiceOutstanding, invoiceTotal } from "@/lib/finance";
import { formatDate, formatRupiah } from "@/lib/format";
import { readDb } from "@/lib/store";

export default async function DokumenPage() {
  const db = await readDb();

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Dokumen"
        title="Invoice, faktur & BA"
        description="Terbitkan invoice untuk menagih. Surat penawaran harga dibuat otomatis saat order masuk. Faktur dan berita acara dibuat otomatis. Surat jalan dibuat dari detail invoice."
        actions={<ButtonLink href="/dokumen/invoice/baru">Buat invoice</ButtonLink>}
      />
      <section>
        <h2 className="mb-3 font-heading text-2xl">Invoice</h2>
        {db.invoices.length === 0 ? (
          <Card>
            <EmptyState title="Belum ada invoice" description="Buat invoice dari order atau langsung dari sini." />
          </Card>
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {db.invoices.map((invoice) => {
                const customer = db.customers.find((row) => row.id === invoice.customerId);
                return (
                  <Link key={invoice.id} href={`/dokumen/invoice/${invoice.id}`}>
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{customer?.name}</p>
                          <p className="text-xs text-muted-foreground">{invoice.number}</p>
                        </div>
                        <InvoiceBadge status={invoice.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{formatDate(invoice.date)}</span>
                        <span className="font-medium">{formatRupiah(invoiceTotal(invoice))}</span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {db.suratJalans.filter((row) => row.invoiceId === invoice.id).length} surat jalan
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>
            <Card className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <Th>Invoice</Th>
                    <Th>Faktur</Th>
                    <Th>Perusahaan</Th>
                    <Th>Tanggal</Th>
                    <Th>Total</Th>
                    <Th>Sisa</Th>
                    <Th>SJ</Th>
                    <Th>Status</Th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {db.invoices.map((invoice) => {
                    const customer = db.customers.find((row) => row.id === invoice.customerId);
                    return (
                      <TableRow key={invoice.id}>
                        <Td>
                          <Link href={`/dokumen/invoice/${invoice.id}`} className="font-medium">
                            {invoice.number}
                          </Link>
                        </Td>
                        <Td className="text-muted-foreground">{invoice.fakturNumber}</Td>
                        <Td>{customer?.name}</Td>
                        <Td>{formatDate(invoice.date)}</Td>
                        <Td>{formatRupiah(invoiceTotal(invoice))}</Td>
                        <Td>{formatRupiah(invoiceOutstanding(invoice))}</Td>
                        <Td>
                          {db.suratJalans.filter((row) => row.invoiceId === invoice.id).length}
                        </Td>
                        <Td>
                          <InvoiceBadge status={invoice.status} />
                        </Td>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-heading text-2xl">Berita acara</h2>
        {db.beritaAcaras.length === 0 ? (
          <Card>
            <EmptyState title="Belum ada berita acara" description="BA dibuat otomatis saat invoice diterbitkan." />
          </Card>
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {db.beritaAcaras.map((ba) => {
                const customer = db.customers.find((row) => row.id === ba.customerId);
                return (
                  <Link key={ba.id} href={`/dokumen/ba/${ba.id}`}>
                    <Card className="p-4">
                      <p className="font-medium">{ba.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{customer?.name}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {ba.number} · {formatDate(ba.date)}
                      </p>
                    </Card>
                  </Link>
                );
              })}
            </div>
            <Card className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <Th>Nomor</Th>
                    <Th>Perusahaan</Th>
                    <Th>Tanggal</Th>
                    <Th>Judul</Th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {db.beritaAcaras.map((ba) => {
                    const customer = db.customers.find((row) => row.id === ba.customerId);
                    return (
                      <TableRow key={ba.id}>
                        <Td>
                          <Link href={`/dokumen/ba/${ba.id}`} className="font-medium">
                            {ba.number}
                          </Link>
                        </Td>
                        <Td>{customer?.name}</Td>
                        <Td>{formatDate(ba.date)}</Td>
                        <Td>{ba.title}</Td>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </section>
    </div>
  );
}
