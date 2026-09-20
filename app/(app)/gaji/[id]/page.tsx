import { notFound } from "next/navigation";
import { deletePayroll } from "@/app/actions";
import { DownloadPdfButton } from "@/components/document-actions";
import { ConfirmSubmit } from "@/components/line-items";
import { PayrollForm, PayrollPayForm } from "@/components/payroll-form";
import {
  ButtonLink,
  Card,
  PageHeader,
  Table,
  TableBody,
  TableHeader,
  TableRow,
  Td,
  Th,
} from "@/components/shared";
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
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <Th>Penerima</Th>
                <Th>Jenis</Th>
                <Th>Pekerjaan</Th>
                <Th>Qty</Th>
                <Th>Tarif</Th>
                <Th>Jumlah</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payroll.items.map((item) => (
                <TableRow key={item.id}>
                  <Td>
                    {item.payeeName}
                    {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
                  </Td>
                  <Td>{PAYEE_KIND_LABEL[item.kind]}</Td>
                  <Td>{WORK_TYPE_LABEL[item.workType]}</Td>
                  <Td>
                    {formatNumber(item.qty)} {item.unit}
                  </Td>
                  <Td>{formatRupiah(item.rate)}</Td>
                  <Td>{formatRupiah(payrollItemAmount(item))}</Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {payroll.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-3">
              <p className="font-medium">{item.payeeName}</p>
              <p className="text-xs text-muted-foreground">
                {PAYEE_KIND_LABEL[item.kind]} · {WORK_TYPE_LABEL[item.workType]}
              </p>
              <p className="mt-2 text-sm">
                {formatNumber(item.qty)} {item.unit} × {formatRupiah(item.rate)}
              </p>
              <p className="mt-1 font-medium">{formatRupiah(payrollItemAmount(item))}</p>
            </div>
          ))}
        </div>
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
