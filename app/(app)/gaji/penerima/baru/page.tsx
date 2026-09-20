import { PayeeForm } from "@/components/payee-form";
import { ButtonLink, PageHeader } from "@/components/shared";

export default function PenerimaBaruPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Penggajian"
        title="Penerima baru"
        description="Pilih pekerja untuk upah borongan, atau vendor jika pekerjaan dikerjakan di perusahaan lain."
        actions={
          <ButtonLink href="/gaji/penerima" variant="outline">
            Kembali
          </ButtonLink>
        }
      />
      <PayeeForm />
    </div>
  );
}
