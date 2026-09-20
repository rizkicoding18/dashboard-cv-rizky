import Link from "next/link";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  SearchBar,
  Table,
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/shared";
import { CATEGORY_LABEL } from "@/lib/labels";
import { filePublicUrl } from "@/lib/file-meta";
import { formatNumber, formatRupiah } from "@/lib/format";
import { readDb } from "@/lib/store";

export default async function BarangPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const db = await readDb();
  const rows = db.products.filter((product) =>
    `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Inventori"
        title="Barang & stok"
        description="Harga jual umum di katalog bisa ditimpa harga khusus per perusahaan. Stok bergerak otomatis saat faktur terbit atau pembelian dicatat."
        actions={<ButtonLink href="/barang/baru">Tambah barang</ButtonLink>}
      />
      <SearchBar placeholder="Cari nama atau SKU" defaultValue={q} />
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada barang"
            description="Masukkan item percetakan, ATK, atau pengadaan."
            action={<ButtonLink href="/barang/baru">Tambah barang</ButtonLink>}
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((product) => {
              const low = product.trackStock && product.stock <= product.minStock;
              return (
                <Link key={product.id} href={`/barang/${product.id}`}>
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        {product.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={filePublicUrl(product.photo)}
                            alt=""
                            className="size-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                      {low ? <Badge tone="warn">Menipis</Badge> : null}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {product.trackStock ? `${formatNumber(product.stock)} ${product.unit}` : "Jasa"}
                      </span>
                      <span className="font-medium">{formatRupiah(product.defaultPrice)}</span>
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
                  <Th>Barang</Th>
                  <Th>Kategori</Th>
                  <Th>Stok</Th>
                  <Th>Modal</Th>
                  <Th>Harga umum</Th>
                  <Th>Harga khusus</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((product) => {
                  const specials = db.customerPrices.filter((row) => row.productId === product.id);
                  const low = product.trackStock && product.stock <= product.minStock;
                  return (
                    <TableRow key={product.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          {product.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={filePublicUrl(product.photo)}
                              alt=""
                              className="size-10 shrink-0 rounded-md object-cover"
                            />
                          ) : null}
                          <div>
                            <Link href={`/barang/${product.id}`} className="font-medium">
                              {product.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{product.sku}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>{CATEGORY_LABEL[product.category]}</Td>
                      <Td>
                        <span className={low ? "text-warn" : undefined}>
                          {product.trackStock ? `${formatNumber(product.stock)} ${product.unit}` : "Tidak dilacak"}
                        </span>
                        {low ? (
                          <span className="ml-2">
                            <Badge tone="warn">Menipis</Badge>
                          </span>
                        ) : null}
                      </Td>
                      <Td>{formatRupiah(product.costPrice)}</Td>
                      <Td>{formatRupiah(product.defaultPrice)}</Td>
                      <Td>{specials.length ? `${specials.length} perusahaan` : "—"}</Td>
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
