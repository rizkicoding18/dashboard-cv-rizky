import { notFound } from "next/navigation";
import { deletePayee } from "@/app/actions";
import { ConfirmSubmit } from "@/components/line-items";
import { PayeeForm } from "@/components/payee-form";
import { ButtonLink, PageHeader } from "@/components/shared";
import { PAYEE_KIND_LABEL } from "@/lib/payroll";
import { readDb } from "@/lib/store";

export default async function PenerimaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const payee = db.payees.find((row) => row.id === id);
  if (!payee) notFound();
  const used = db.payrolls.some((row) => row.items.some((item) => item.payeeId === payee.id));

  return (
    <div>
      <PageHeader
        eyebrow={PAYEE_KIND_LABEL[payee.kind]}
        title={payee.name}
        description={payee.notes || "Penerima upah atau vendor nota produksi luar."}
        actions={
          <>
            <ButtonLink href="/gaji/penerima" variant="outline">
              Kembali
            </ButtonLink>
            {used ? null : (
              <ConfirmSubmit
                label="Hapus"
                message="Hapus penerima ini?"
                action={deletePayee.bind(null, payee.id)}
              />
            )}
          </>
        }
      />
      <PayeeForm payee={payee} />
    </div>
  );
}
