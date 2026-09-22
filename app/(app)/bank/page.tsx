import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { BanksTable } from "@/components/tables/list-tables";
import { readDb } from "@/lib/store";

export default async function BankPage() {
  const db = await readDb();
  const data = db.banks.map((bank) => ({
    id: bank.id,
    href: `/bank/${bank.id}`,
    bankName: bank.bankName,
    notes: bank.notes,
    accountNumber: bank.accountNumber,
    holder: bank.holder,
    isDefault: bank.isDefault,
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Keuangan"
        title="Rekening bank"
        description="Rekening ini dipakai sebagai tujuan pembayaran di invoice dan faktur."
        actions={<ButtonLink href="/bank/baru">Tambah rekening</ButtonLink>}
      />
      {data.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada rekening"
            description="Tambahkan rekening usaha agar nomor rekening tampil di invoice."
            action={<ButtonLink href="/bank/baru">Tambah rekening</ButtonLink>}
          />
        </Card>
      ) : (
        <BanksTable data={data} />
      )}
    </div>
  );
}
