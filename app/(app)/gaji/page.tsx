import Link from "next/link";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  Table,
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/shared";
import { PayrollBadge } from "@/components/status";
import { computeFinance } from "@/lib/finance";
import { currentMonthKey, formatDate, formatRupiah } from "@/lib/format";
import { payrollKindTotal, payrollTotal } from "@/lib/payroll";
import { readDb } from "@/lib/store";

export default async function GajiPage() {
  const db = await readDb();
  const month = currentMonthKey();
  const finance = computeFinance(db, month);
  const rows = db.payrolls;

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
            {formatRupiah(rows.filter((row) => row.status === "terbit").reduce((sum, row) => sum + payrollTotal(row), 0))}
          </p>
        </Card>
      </div>
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada rincian gaji"
            description="Catat upah borongan atau nota vendor per pekerjaan."
            action={<ButtonLink href="/gaji/baru">Buat rincian</ButtonLink>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid gap-3 p-4 md:hidden">
            {rows.map((row) => (
              <Link key={row.id} href={`/gaji/${row.id}`} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(row.date)}</p>
                  </div>
                  <PayrollBadge status={row.status} />
                </div>
                <p className="mt-2 text-sm font-medium">{formatRupiah(payrollTotal(row))}</p>
              </Link>
            ))}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <Th>Nomor</Th>
                  <Th>Tanggal</Th>
                  <Th>Upah</Th>
                  <Th>Nota luar</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <Td>
                      <Link href={`/gaji/${row.id}`} className="font-medium text-primary">
                        {row.number}
                      </Link>
                    </Td>
                    <Td>{formatDate(row.date)}</Td>
                    <Td>{formatRupiah(payrollKindTotal(row, "pekerja"))}</Td>
                    <Td>{formatRupiah(payrollKindTotal(row, "vendor"))}</Td>
                    <Td>{formatRupiah(payrollTotal(row))}</Td>
                    <Td>
                      <PayrollBadge status={row.status} />
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
