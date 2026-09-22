import { notFound } from "next/navigation";
import { deleteCustomerPrice } from "@/app/actions";
import { PriceForm, PurchaseForm } from "@/components/money-forms";
import { ProductForm } from "@/components/product-form";
import { ProductMediaCard } from "@/components/file-uploads";
import { Card, PageHeader } from "@/components/shared";
import { ProductPricesTable, StockMovesTable } from "@/components/tables/detail-tables";
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
          <ProductMediaCard
            productId={product.id}
            category={product.category}
            photo={product.photo}
            printFiles={product.printFiles ?? []}
          />
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
            {prices.length > 0 ? (
              <div className="mt-4">
                <ProductPricesTable
                  data={prices.map((price) => ({
                    id: price.id,
                    customer: db.customers.find((row) => row.id === price.customerId)?.name || "—",
                    notes: price.notes || "",
                    price: formatRupiah(price.unitPrice),
                    deleteAction: deleteCustomerPrice.bind(null, price.id),
                  }))}
                />
              </div>
            ) : null}
          </Card>
          <PurchaseForm products={[product]} />
          <Card>
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-heading text-xl">Mutasi stok</h2>
            </div>
            {moves.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Belum ada mutasi.</p>
            ) : (
              <StockMovesTable
                data={moves.map((move) => ({
                  id: move.id,
                  date: formatDate(move.date),
                  type: move.type,
                  qty: `${move.type === "keluar" ? "-" : "+"}${formatNumber(move.qty)} ${product.unit}`,
                }))}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
