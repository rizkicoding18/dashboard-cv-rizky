import { ConfirmSubmit } from "@/components/line-items";
import { ExpenseForm, PurchaseForm } from "@/components/money-forms";
import { ReportExportMenu } from "@/components/document-actions";
import {
  Button,
  Card,
  PageHeader,
  Select,
  Table,
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/shared";
import { computeFinance, purchaseTotal } from "@/lib/finance";
import { currentMonthKey, formatDate, formatMonth, formatRupiah } from "@/lib/format";
import { EXPENSE_LABEL } from "@/lib/labels";
import { deleteExpense } from "@/app/actions";
import { readDb } from "@/lib/store";

function Line({
  label,
  hint,
  value,
  strong,
}: {
  label: string;
  hint?: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 ${strong ? "border-t border-border pt-3 font-semibold" : ""}`}>
      <div className="min-w-0">
        <p className={strong ? "" : "text-sm"}>{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <span className="shrink-0 tabular-nums">{formatRupiah(value)}</span>
    </div>
  );
}

export default async function KeuanganPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const { periode } = await searchParams;
  const db = await readDb();
  const month = periode || currentMonthKey();
  const finance = computeFinance(db, month);
  const months = Array.from(
    new Set([
      currentMonthKey(),
      ...db.invoices.map((row) => row.date.slice(0, 7)),
      ...db.expenses.map((row) => row.date.slice(0, 7)),
      ...db.payrolls.map((row) => row.date.slice(0, 7)),
    ]),
  )
    .sort()
    .reverse();

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Uang masuk & keluar"
        description="Dua laporan: laba rugi (hasil usaha selama sebulan) dan neraca (kondisi kas, piutang, dan hutang hari ini)."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Uang di kas/bank</p>
          <p className="mt-2 font-heading text-2xl tabular-nums">{formatRupiah(finance.kas)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Siap dipakai hari ini</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Belum tertagih</p>
          <p className="mt-2 font-heading text-2xl tabular-nums">{formatRupiah(finance.piutang)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Faktur pelanggan yang belum lunas</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Laba {formatMonth(month)}</p>
          <p className="mt-2 font-heading text-2xl tabular-nums">{formatRupiah(finance.labaBersih)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Setelah modal barang, beban, upah, dan nota luar</p>
        </Card>
      </div>

      <Card className="p-5">
        <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="grid min-w-0 flex-1 gap-1 text-sm">
            <span className="font-medium">Lihat bulan</span>
            <Select name="periode" defaultValue={month}>
              {months.map((value) => (
                <option key={value} value={value}>
                  {formatMonth(value)}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit" variant="outline">
            Tampilkan
          </Button>
          <div className="flex flex-wrap gap-2">
            <ReportExportMenu
              label="Laba rugi"
              pdfHref={`/api/pdf/laba-rugi/${month}`}
              printHref={`/cetak/laba-rugi/${month}`}
            />
            <ReportExportMenu
              label="Neraca"
              pdfHref={`/api/pdf/neraca/${month}`}
              printHref={`/cetak/neraca/${month}`}
            />
          </div>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          Laba rugi mengikuti bulan yang dipilih. Neraca selalu posisi terkini, laba tahun mengikuti tahun bulan itu.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-heading text-xl">Laba rugi · {formatMonth(month)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Apakah usaha untung di bulan ini?</p>
          <div className="mt-4">
            <Line label="Pendapatan" hint="Faktur yang sudah terbit, tanpa PPN" value={finance.pendapatan} />
            <Line label="Modal barang" hint="HPP barang yang terjual" value={finance.hpp} />
            <Line label="Laba kotor" hint="Pendapatan dikurangi modal barang" value={finance.labaKotor} strong />
            <Line label="Beban operasional" hint="Sewa, listrik, dan biaya harian" value={finance.bebanOperasional} />
            <Line label="Upah pekerjaan" hint="Bayar orang sesuai banyaknya kerja" value={finance.bebanUpah} />
            <Line label="Produksi luar" hint="Nota desain/cetak di tempat lain" value={finance.bebanProduksiLuar} />
            <Line label="Laba bersih" hint="Sisa yang benar-benar jadi milik usaha" value={finance.labaBersih} strong />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-heading text-xl">Neraca</h2>
          <p className="mt-1 text-sm text-muted-foreground">Apa yang dimiliki dan apa yang masih harus dibayar.</p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dimiliki</p>
              <Line label="Kas & rekening" hint="Uang tunai dan bank" value={finance.kas} />
              <Line label="Piutang" hint="Pelanggan belum bayar" value={finance.piutang} />
              <Line label="Persediaan" hint="Nilai stok di gudang" value={finance.persediaan} />
              <Line label="Total" value={finance.aktiva} strong />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sumber dana</p>
              <Line label="Hutang pembelian" hint="Bahan belum dibayar" value={finance.hutang - finance.hutangGaji} />
              <Line label="Hutang gaji & nota" hint="Upah/vendor belum dibayar" value={finance.hutangGaji} />
              <Line label="PPN keluaran" hint="PPN di faktur terbit" value={finance.ppnKeluaran} />
              <Line label="Modal awal" value={finance.modal} />
              <Line label="Laba tahun ini" value={finance.labaTahun} />
              {finance.penyesuaian ? <Line label="Penyesuaian" value={finance.penyesuaian} /> : null}
              <Line label="Total" value={finance.kewajiban + finance.ekuitas} strong />
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="font-heading text-xl">Catat transaksi</h2>
        <p className="mt-1 text-sm text-muted-foreground">Isi di sini jika ada biaya harian atau belanja stok.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ExpenseForm />
        <PurchaseForm products={db.products} />
      </div>

      <Card>
        <div className="border-b px-5 py-4">
          <h2 className="font-heading text-xl">Beban tercatat</h2>
        </div>
        {db.expenses.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Belum ada beban operasional.</p>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {db.expenses.map((expense) => (
                <div key={expense.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{EXPENSE_LABEL[expense.category]}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{expense.description}</p>
                    </div>
                    <span className="text-sm font-medium">{formatRupiah(expense.amount)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                    <ConfirmSubmit
                      label="Hapus"
                      message="Hapus beban ini?"
                      variant="outline"
                      action={deleteExpense.bind(null, expense.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <Th>Tanggal</Th>
                    <Th>Kategori</Th>
                    <Th>Uraian</Th>
                    <Th>Nominal</Th>
                    <Th></Th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {db.expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <Td>{formatDate(expense.date)}</Td>
                      <Td>{EXPENSE_LABEL[expense.category]}</Td>
                      <Td>{expense.description}</Td>
                      <Td>{formatRupiah(expense.amount)}</Td>
                      <Td className="text-right">
                        <ConfirmSubmit
                          label="Hapus"
                          message="Hapus beban ini?"
                          variant="outline"
                          action={deleteExpense.bind(null, expense.id)}
                        />
                      </Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
      <Card>
        <div className="border-b px-5 py-4">
          <h2 className="font-heading text-xl">Pembelian stok</h2>
        </div>
        {db.purchases.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Belum ada pembelian.</p>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {db.purchases.map((purchase) => (
                <div key={purchase.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{purchase.supplier}</p>
                      <p className="text-xs text-muted-foreground">{purchase.number}</p>
                    </div>
                    <span className="text-sm font-medium">{formatRupiah(purchaseTotal(purchase.items))}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{formatDate(purchase.date)}</span>
                    <span>{purchase.paid ? "Lunas" : "Belum dibayar"}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <Th>Nomor</Th>
                    <Th>Supplier</Th>
                    <Th>Tanggal</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {db.purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <Td>{purchase.number}</Td>
                      <Td>{purchase.supplier}</Td>
                      <Td>{formatDate(purchase.date)}</Td>
                      <Td>{formatRupiah(purchaseTotal(purchase.items))}</Td>
                      <Td>{purchase.paid ? "Lunas" : "Belum dibayar"}</Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
