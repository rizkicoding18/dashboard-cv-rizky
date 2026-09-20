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
import { OrderBadge } from "@/components/status";
import { formatDate, formatRupiah } from "@/lib/format";
import { invoiceSubtotal } from "@/lib/finance";
import { readDb } from "@/lib/store";

export default async function OrderPage() {
  const db = await readDb();
  const rows = db.orders;

  return (
    <div>
      <PageHeader
        eyebrow="Produksi"
        title="Order masuk"
        description="Catat permintaan perusahaan. Surat penawaran harga dibuat otomatis, lalu lanjut invoice jika disetujui."
        actions={<ButtonLink href="/order/baru">Order baru</ButtonLink>}
      />
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada order"
            description="Order masuk bisa berisi item katalog atau pekerjaan custom."
            action={<ButtonLink href="/order/baru">Buat order</ButtonLink>}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((order) => {
              const customer = db.customers.find((row) => row.id === order.customerId);
              return (
                <Link key={order.id} href={`/order/${order.id}`}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{customer?.name}</p>
                        <p className="text-xs text-muted-foreground">{order.number}</p>
                      </div>
                      <OrderBadge status={order.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{formatDate(order.date)}</span>
                      <span className="font-medium">{formatRupiah(invoiceSubtotal(order.items))}</span>
                    </div>
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
                  <Th>Nilai</Th>
                  <Th>Status</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((order) => {
                  const customer = db.customers.find((row) => row.id === order.customerId);
                  return (
                    <TableRow key={order.id}>
                      <Td>
                        <Link href={`/order/${order.id}`} className="font-medium">
                          {order.number}
                        </Link>
                      </Td>
                      <Td>{customer?.name}</Td>
                      <Td>{formatDate(order.date)}</Td>
                      <Td>{formatRupiah(invoiceSubtotal(order.items))}</Td>
                      <Td>
                        <OrderBadge status={order.status} />
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
