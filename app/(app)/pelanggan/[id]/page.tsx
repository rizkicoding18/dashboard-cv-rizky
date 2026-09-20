import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCustomer } from "@/app/actions";
import { CustomerForm } from "@/components/customer-form";
import { ConfirmSubmit } from "@/components/line-items";
import { ButtonLink, Card, PageHeader, Table, TableBody, TableHeader, TableRow, Td, Th } from "@/components/shared";
import { OrderBadge } from "@/components/status";
import { formatRupiah } from "@/lib/format";
import { readDb } from "@/lib/store";

export default async function PelangganDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const customer = db.customers.find((row) => row.id === id);
  if (!customer) notFound();
  const prices = db.customerPrices.filter((row) => row.customerId === id);
  const orders = db.orders.filter((row) => row.customerId === id);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Relasi"
        title={customer.name}
        description={customer.notes || "Harga khusus perusahaan ini menimpa harga katalog saat membuat order atau faktur."}
        actions={
          <ConfirmSubmit
            label="Hapus"
            message="Hapus perusahaan ini?"
            action={deleteCustomer.bind(null, id)}
          />
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CustomerForm customer={customer} />
        <div className="grid gap-6">
          <Card>
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-heading text-xl">Harga khusus</h2>
            </div>
            {prices.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Belum ada harga khusus. Atur dari halaman barang.
              </p>
            ) : (
              <>
                <div className="grid gap-3 p-4 md:hidden">
                  {prices.map((price) => {
                    const product = db.products.find((row) => row.id === price.productId);
                    return (
                      <Link key={price.id} href={`/barang/${price.productId}`} className="rounded-xl border p-4">
                        <p className="font-medium">{product?.name}</p>
                        {price.notes ? <p className="mt-1 text-xs text-muted-foreground">{price.notes}</p> : null}
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Umum {formatRupiah(product?.defaultPrice || 0)}</span>
                          <span className="font-medium">{formatRupiah(price.unitPrice)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <Th>Item</Th>
                        <Th>Harga khusus</Th>
                        <Th>Harga umum</Th>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prices.map((price) => {
                        const product = db.products.find((row) => row.id === price.productId);
                        return (
                          <TableRow key={price.id}>
                            <Td>
                              <Link href={`/barang/${price.productId}`}>{product?.name}</Link>
                              {price.notes ? <p className="text-xs text-muted-foreground">{price.notes}</p> : null}
                            </Td>
                            <Td>{formatRupiah(price.unitPrice)}</Td>
                            <Td>{formatRupiah(product?.defaultPrice || 0)}</Td>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </Card>
          <Card>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-heading text-xl">Order</h2>
              <ButtonLink href={`/order/baru?customerId=${customer.id}`} size="sm">
                Order baru
              </ButtonLink>
            </div>
            <div className="divide-y divide-border">
              {orders.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted-foreground">Belum ada order.</p>
              ) : (
                orders.map((order) => (
                  <Link key={order.id} href={`/order/${order.id}`} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span>{order.number}</span>
                    <OrderBadge status={order.status} />
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
