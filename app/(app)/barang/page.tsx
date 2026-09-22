import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { ProductsTable } from "@/components/tables/list-tables";
import { CATEGORY_LABEL } from "@/lib/labels";
import { filePublicUrl } from "@/lib/file-meta";
import { formatNumber, formatRupiah } from "@/lib/format";
import { readDb } from "@/lib/store";

export default async function BarangPage() {
  const db = await readDb();
  const data = db.products.map((product) => {
    const specials = db.customerPrices.filter((row) => row.productId === product.id);
    const low = product.trackStock && product.stock <= product.minStock;
    return {
      id: product.id,
      href: `/barang/${product.id}`,
      name: product.name,
      sku: product.sku,
      photoUrl: product.photo ? filePublicUrl(product.photo) : null,
      category: CATEGORY_LABEL[product.category],
      stock: product.trackStock ? `${formatNumber(product.stock)} ${product.unit}` : "Tidak dilacak",
      low,
      cost: formatRupiah(product.costPrice),
      price: formatRupiah(product.defaultPrice),
      specials: specials.length ? `${specials.length} perusahaan` : "—",
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Inventori"
        title="Barang & stok"
        description="Harga jual umum di katalog bisa ditimpa harga khusus per perusahaan. Stok bergerak otomatis saat faktur terbit atau pembelian dicatat."
        actions={<ButtonLink href="/barang/baru">Tambah barang</ButtonLink>}
      />
      {data.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada barang"
            description="Masukkan item percetakan, ATK, atau pengadaan."
            action={<ButtonLink href="/barang/baru">Tambah barang</ButtonLink>}
          />
        </Card>
      ) : (
        <ProductsTable data={data} />
      )}
    </div>
  );
}
