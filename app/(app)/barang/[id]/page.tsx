import { notFound } from "next/navigation";
import { deleteCustomerPrice } from "@/app/actions";
import { ConfirmSubmit } from "@/components/line-items";
import { PriceForm, PurchaseForm } from "@/components/money-forms";
import { ProductForm } from "@/components/product-form";
import { Card, PageHeader, Table, TableBody, TableHeader, TableRow, Td, Th } from "@/components/shared";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { readDb } from "@/lib/store";

export default async function BarangDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const product = db.products.find((row) => row.id === id);
  if (!product) notFound();
  const prices = db.customerPrices.filter((row) => row.productId === id);
  const moves = db.stockMoves
    .filter((row) => row.productId === id)
    .slice()
    .reverse()
    .slice(0, 12);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={product.sku}
        title={product.name}
        description="Satu item, banyak harga: atur kesepakatan per perusahaan di bawah."
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ProductForm product={product} />
        <div className="grid gap-6">
          <Card className="p-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl">Harga per perusahaan</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Harga umum {formatRupiah(product.defaultPrice)} / {product.unit}
                </p>
              </div>
            </div>
            <PriceForm customers={db.customers} productId={product.id} />
            <div className="mt-4 grid gap-3 md:hidden">
              {prices.map((price) => {
                const customer = db.customers.find((row) => row.id === price.customerId);
                return (
                  <div key={price.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{customer?.name}</p>
                        {price.notes ? <p className="mt-1 text-xs text-muted-foreground">{price.notes}</p> : null}
                      </div>
                      <span className="text-sm font-medium">{formatRupiah(price.unitPrice)}</span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <ConfirmSubmit
                        label="Hapus"
                        message="Hapus harga khusus ini?"
                        variant="outline"
                        action={deleteCustomerPrice.bind(null, price.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <Th>Perusahaan</Th>
                    <Th>Harga</Th>
                    <Th></Th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => {
                    const customer = db.customers.find((row) => row.id === price.customerId);
                    return (
                      <TableRow key={price.id}>
                        <Td>
                          {customer?.name}
                          {price.notes ? <p className="text-xs text-muted-foreground">{price.notes}</p> : null}
                        </Td>
                        <Td>{formatRupiah(price.unitPrice)}</Td>
                        <Td className="text-right">
                          <ConfirmSubmit
                            label="Hapus"
                            message="Hapus harga khusus ini?"
                            variant="outline"
                            action={deleteCustomerPrice.bind(null, price.id)}
                          />
                        </Td>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
          <PurchaseForm products={[product]} />
          <Card>
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-heading text-xl">Mutasi stok</h2>
            </div>
            {moves.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Belum ada mutasi.</p>
            ) : (
              <>
                <div className="grid gap-3 p-4 md:hidden">
                  {moves.map((move) => (
                    <div key={move.id} className="flex items-center justify-between rounded-xl border p-4 text-sm">
                      <div>
                        <p className="font-medium capitalize">{move.type}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(move.date)}</p>
                      </div>
                      <span>
                        {move.type === "keluar" ? "-" : "+"}
                        {formatNumber(move.qty)} {product.unit}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <Th>Tanggal</Th>
                        <Th>Tipe</Th>
                        <Th>Qty</Th>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {moves.map((move) => (
                        <TableRow key={move.id}>
                          <Td>{formatDate(move.date)}</Td>
                          <Td className="capitalize">{move.type}</Td>
                          <Td>
                            {move.type === "keluar" ? "-" : "+"}
                            {formatNumber(move.qty)} {product.unit}
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
      </div>
    </div>
  );
}
