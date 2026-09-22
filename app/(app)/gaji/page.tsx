import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/shared";
import { PayrollsTable } from "@/components/tables/list-tables";
import { computeFinance } from "@/lib/finance";
import { currentMonthKey, formatDate, formatRupiah } from "@/lib/format";
import { payrollKindTotal, payrollTotal } from "@/lib/payroll";
import { readDb } from "@/lib/store";

export default async function GajiPage() {
  const db = await readDb();
  const month = currentMonthKey();
  const finance = computeFinance(db, month);
  const data = db.payrolls.map((row) => ({
    id: row.id,
    href: `/gaji/${row.id}`,
    number: row.number,
    date: formatDate(row.date),
    wage: formatRupiah(payrollKindTotal(row, "pekerja")),
    vendor: formatRupiah(payrollKindTotal(row, "vendor")),
    total: formatRupiah(payrollTotal(row)),
    status: row.status,
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Penggajian"
        description="Upah tidak tetap: dihitung dari orang yang mengerjakan dan volume pekerjaan. Nota desain/cetak dari perusahaan luar juga dicatat di sini dan masuk neraca."
        actions={
          <>
            <ButtonLink href="/gaji/penerima" variant="outline">
              Penerima
            </ButtonLink>
            <ButtonLink href="/gaji/baru">Rincian baru</ButtonLink>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Upah pekerja bulan ini</p>
          <p className="mt-2 font-heading text-2xl">{formatRupiah(finance.bebanUpah)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nota produksi luar</p>
          <p className="mt-2 font-heading text-2xl">{formatRupiah(finance.bebanProduksiLuar)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Belum dibayar</p>
          <p className="mt-2 font-heading text-2xl">
            {formatRupiah(db.payrolls.filter((row) => row.status === "terbit").reduce((sum, row) => sum + payrollTotal(row), 0))}
          </p>
        </Card>
      </div>
      {data.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada rincian gaji"
            description="Catat upah borongan atau nota vendor per pekerjaan."
            action={<ButtonLink href="/gaji/baru">Buat rincian</ButtonLink>}
          />
        </Card>
      ) : (
        <PayrollsTable data={data} />
      )}
    </div>
  );
}
