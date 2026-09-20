import { ConfirmSubmit } from "@/components/line-items";
import { ExpenseForm, PurchaseForm } from "@/components/money-forms";
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

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 py-1.5 ${strong ? "border-t border-border pt-3 font-semibold" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{formatRupiah(value)}</span>
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
    ]),
  ).sort()
    .reverse();

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Keuangan"
        title="Neraca & laba rugi"
        description="Otomatis dari faktur terbit, HPP, stok, pembayaran, pembelian, dan beban operasional."
      />
      <form className="flex max-w-md flex-col gap-2 sm:flex-row sm:items-end">
        <label className="grid min-w-0 flex-1 gap-1 text-sm">
          <span className="font-medium">Periode laba rugi</span>
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
      </form>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-heading text-2xl">Laba rugi · {formatMonth(month)}</h2>
          <div className="mt-4 text-sm">
            <Row label="Pendapatan usaha" value={finance.pendapatan} />
            <Row label="Harga pokok penjualan" value={finance.hpp} />
            <Row label="Laba kotor" value={finance.labaKotor} strong />
            <Row label="Beban operasional" value={finance.beban} />
            <Row label="Laba bersih" value={finance.labaBersih} strong />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-heading text-2xl">Neraca</h2>
          <p className="mt-1 text-xs text-muted-foreground">Posisi saat ini, bukan hanya bulan terpilih.</p>
          <div className="mt-4 grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aktiva</p>
              <Row label="Kas & bank" value={finance.kas} />
              <Row label="Piutang usaha" value={finance.piutang} />
              <Row label="Persediaan" value={finance.persediaan} />
              <Row label="Total aktiva" value={finance.aktiva} strong />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kewajiban & ekuitas</p>
              <Row label="Hutang usaha" value={finance.hutang} />
              <Row label="PPN keluaran" value={finance.ppnKeluaran} />
              <Row label="Modal" value={finance.modal} />
              <Row label="Laba tahun berjalan" value={finance.labaTahun} />
              {finance.penyesuaian ? <Row label="Penyesuaian saldo awal" value={finance.penyesuaian} /> : null}
              <Row label="Total pasiva" value={finance.kewajiban + finance.ekuitas} strong />
            </div>
          </div>
        </Card>
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
          <p className="px-5 py-8 text-sm text-muted-foreground">Belum ada beban.</p>
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
          <h2 className="font-heading text-xl">Pembelian</h2>
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
