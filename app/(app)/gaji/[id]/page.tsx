import { notFound } from "next/navigation";
import { deletePayroll } from "@/app/actions";
import { DownloadPdfButton } from "@/components/document-actions";
import { ConfirmSubmit } from "@/components/line-items";
import { PayrollForm, PayrollPayForm } from "@/components/payroll-form";
import { ButtonLink, Card, PageHeader } from "@/components/shared";
import { PayrollItemsTable } from "@/components/tables/detail-tables";
import { PayrollBadge } from "@/components/status";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { PAYEE_KIND_LABEL, WORK_TYPE_LABEL, payrollItemAmount, payrollKindTotal, payrollTotal } from "@/lib/payroll";
import { readDb } from "@/lib/store";

export default async function GajiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const payroll = db.payrolls.find((row) => row.id === id);
  if (!payroll) notFound();
  const order = payroll.orderId ? db.orders.find((row) => row.id === payroll.orderId) : null;
  const total = payrollTotal(payroll);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={payroll.number}
        title="Rincian penggajian"
        description={
          order
            ? `Terkait ${order.number}. Upah dan nota ini masuk laba rugi serta neraca.`
            : "Upah dan nota ini masuk laba rugi serta neraca."
        }
        actions={
          <>
            <ButtonLink href={`/cetak/gaji/${payroll.id}`} variant="outline">
              Cetak
            </ButtonLink>
            <DownloadPdfButton href={`/api/pdf/gaji/${payroll.id}`} label="Unduh PDF" />
            <ConfirmSubmit
              label="Hapus"
              message="Hapus rincian gaji ini dari laporan keuangan?"
              action={deletePayroll.bind(null, payroll.id)}
            />
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <PayrollBadge status={payroll.status} />
        <span className="text-muted-foreground">{formatDate(payroll.date)}</span>
        <span>Upah {formatRupiah(payrollKindTotal(payroll, "pekerja"))}</span>
        <span>Nota luar {formatRupiah(payrollKindTotal(payroll, "vendor"))}</span>
        <span className="font-medium">{formatRupiah(total)}</span>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-heading text-lg">Rincian</h2>
        </div>
        <PayrollItemsTable
          data={payroll.items.map((item) => ({
            id: item.id,
            name: item.payeeName,
            description: item.description || "",
            kind: PAYEE_KIND_LABEL[item.kind],
            work: WORK_TYPE_LABEL[item.workType],
            qty: `${formatNumber(item.qty)} ${item.unit}`,
            rate: formatRupiah(item.rate),
            amount: formatRupiah(payrollItemAmount(item)),
          }))}
        />
      </Card>
      {payroll.status === "terbit" ? (
        <Card className="p-5">
          <h2 className="mb-3 font-heading text-lg">Pembayaran</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Selama belum lunas, total ini tercatat sebagai hutang di neraca. Setelah lunas, kas berkurang.
          </p>
          <PayrollPayForm payrollId={payroll.id} />
        </Card>
      ) : null}
      {payroll.status !== "lunas" ? (
        <details className="rounded-xl border border-border">
          <summary className="cursor-pointer list-none px-5 py-3 text-sm font-medium text-primary marker:content-none [&::-webkit-details-marker]:hidden">
            Ubah rincian
          </summary>
          <div className="border-t border-border px-5 py-5">
            <PayrollForm payees={db.payees} orders={db.orders} payroll={payroll} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
