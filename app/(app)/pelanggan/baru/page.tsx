import { CustomerForm } from "@/components/customer-form";
import { PageHeader } from "@/components/shared";

export default function PelangganBaruPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Relasi"
        title="Perusahaan baru"
        description="Simpan data perusahaan beserta PIC dan NPWP untuk keperluan faktur."
      />
      <CustomerForm />
    </div>
  );
}
