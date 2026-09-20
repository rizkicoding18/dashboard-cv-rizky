import Link from "next/link";
import { ButtonLink, Card, PageHeader } from "@/components/shared";
import { InvoiceBadge, OrderBadge } from "@/components/status";
import { computeFinance, invoiceOutstanding } from "@/lib/finance";
import { currentMonthKey, formatMonth, formatRupiah } from "@/lib/format";
import { readDb } from "@/lib/store";

export default async function DashboardPage() {
  const db = await readDb();
  const month = currentMonthKey();
  const finance = computeFinance(db, month);
  const activeOrders = db.orders.filter((order) => order.status === "baru" || order.status === "proses");
  const unpaid = db.invoices.filter((invoice) => invoiceOutstanding(invoice) > 0);
  const lowStock = db.products.filter(
    (product) => product.trackStock && product.stock <= product.minStock,
  );

  const kpis = [
    { label: "Omzet bulan ini", value: formatRupiah(finance.omzetBulanIni), hint: formatMonth(month) },
    { label: "Laba bulan ini", value: formatRupiah(finance.labaBulanIni), hint: "Setelah HPP dan beban" },
    { label: "Piutang", value: formatRupiah(finance.piutang), hint: `${unpaid.length} faktur belum lunas` },
    { label: "Kas", value: formatRupiah(finance.kas), hint: "Saldo kas & bank" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Ringkasan"
        title="Hari ini di bengkel cetak"
        description="Order, stok, faktur, dan laba rugi dalam satu layar. Harga jual mengikuti kesepakatan masing-masing perusahaan."
        actions={
          <>
            <ButtonLink href="/order/baru" variant="outline">
              Order baru
            </ButtonLink>
            <ButtonLink href="/dokumen/invoice/baru">Buat invoice</ButtonLink>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
            <p className="mt-3 font-heading text-3xl tabular-nums">{item.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{item.hint}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-heading text-xl">Order aktif</h2>
            <Link href="/order" className="text-sm text-primary">
              Lihat semua
            </Link>
          </div>
          <div className="divide-y">
            {activeOrders.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">Belum ada order yang berjalan.</p>
            ) : (
              activeOrders.slice(0, 6).map((order) => {
                const customer = db.customers.find((row) => row.id === order.customerId);
                return (
                  <Link key={order.id} href={`/order/${order.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{customer?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.number} · {order.items.length} item
                      </p>
                    </div>
                    <OrderBadge status={order.status} />
                  </Link>
                );
              })
            )}
          </div>
        </Card>
        <Card>
          <div className="border-b px-5 py-4">
            <h2 className="font-heading text-xl">Perlu perhatian</h2>
          </div>
          <div className="grid gap-4 p-5 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stok menipis</p>
              {lowStock.length === 0 ? (
                <p className="mt-2 text-muted-foreground">Stok aman.</p>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {lowStock.map((product) => (
                    <li key={product.id} className="flex justify-between">
                      <Link href={`/barang/${product.id}`}>{product.name}</Link>
                      <span className="text-warn">
                        {product.stock} {product.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faktur belum lunas</p>
              {unpaid.length === 0 ? (
                <p className="mt-2 text-muted-foreground">Tidak ada piutang terbuka.</p>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {unpaid.slice(0, 5).map((invoice) => {
                    const customer = db.customers.find((row) => row.id === invoice.customerId);
                    return (
                      <li key={invoice.id} className="flex justify-between gap-3">
                        <Link href={`/dokumen/invoice/${invoice.id}`}>{customer?.name}</Link>
                        <span>{formatRupiah(invoiceOutstanding(invoice))}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
