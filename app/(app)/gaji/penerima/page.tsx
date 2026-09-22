import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { PayeesTable } from "@/components/tables/list-tables";
import { PAYEE_KIND_LABEL } from "@/lib/payroll";
import { readDb } from "@/lib/store";

export default async function PenerimaPage() {
  const db = await readDb();
  const data = db.payees.map((row) => ({
    id: row.id,
    href: `/gaji/penerima/${row.id}`,
    name: row.name,
    notes: row.notes,
    kind: PAYEE_KIND_LABEL[row.kind],
    phone: row.phone || "—",
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Penggajian"
        title="Penerima upah & vendor"
        description="Pekerja dihitung per volume. Vendor adalah perusahaan luar yang mengirim nota desain, cetak, atau pekerjaan lain."
        actions={
          <>
            <ButtonLink href="/gaji" variant="outline">
              Kembali
            </ButtonLink>
            <ButtonLink href="/gaji/penerima/baru">Tambah penerima</ButtonLink>
          </>
        }
      />
      {data.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada penerima"
            description="Tambah orang yang mengerjakan, atau perusahaan luar yang memberi nota."
            action={<ButtonLink href="/gaji/penerima/baru">Tambah penerima</ButtonLink>}
          />
        </Card>
      ) : (
        <PayeesTable data={data} />
      )}
    </div>
  );
}
