import { ProductForm } from "@/components/product-form";
import { PageHeader } from "@/components/shared";

export default function BarangBaruPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Inventori"
        title="Barang baru"
        description="Isi harga umum. Harga per perusahaan bisa ditambahkan setelah barang tersimpan."
      />
      <ProductForm />
    </div>
  );
}
