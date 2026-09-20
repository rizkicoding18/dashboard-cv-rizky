import { BankForm } from "@/components/bank-form";
import { PageHeader } from "@/components/shared";

export default function BankBaruPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Keuangan"
        title="Rekening baru"
        description="Rekening default dipakai otomatis saat membuat invoice."
      />
      <BankForm />
    </div>
  );
}
