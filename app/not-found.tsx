import { ButtonLink, PageHeader } from "@/components/shared";

export default function NotFound() {
  return (
    <div className="px-6 py-16">
      <PageHeader
        title="Halaman tidak ditemukan"
        description="Data mungkin sudah dihapus, atau tautannya tidak tepat."
        actions={<ButtonLink href="/">Kembali ke ringkasan</ButtonLink>}
      />
    </div>
  );
}
