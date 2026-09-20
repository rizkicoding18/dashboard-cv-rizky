import { notFound } from "next/navigation";
import { deleteBank } from "@/app/actions";
import { BankForm } from "@/components/bank-form";
import { ConfirmSubmit } from "@/components/line-items";
import { PageHeader } from "@/components/shared";
import { readDb } from "@/lib/store";

export default async function BankDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const bank = db.banks.find((row) => row.id === id);
  if (!bank) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Keuangan"
        title={`${bank.bankName} ${bank.accountNumber}`}
        description={bank.isDefault ? "Rekening default untuk invoice baru." : "Bisa dijadikan default saat disimpan."}
        actions={
          db.banks.length > 1 ? (
            <ConfirmSubmit
              label="Hapus"
              message="Hapus rekening ini? Invoice yang memakai rekening ini akan dialihkan ke rekening default."
              action={deleteBank.bind(null, id)}
            />
          ) : undefined
        }
      />
      <BankForm bank={bank} />
    </div>
  );
}
