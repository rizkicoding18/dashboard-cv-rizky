import { notFound } from "next/navigation";
import { PayrollDocument } from "@/components/documents";
import { PrintToolbar } from "@/components/document-actions";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CetakGajiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const payroll = db.payrolls.find((row) => row.id === id);
  if (!payroll) notFound();
  const order = payroll.orderId ? db.orders.find((row) => row.id === payroll.orderId) : null;

  return (
    <div className="min-h-full bg-stone-100 py-6 print:bg-white print:py-0">
      <PrintToolbar
        backHref={`/gaji/${payroll.id}`}
        pdfHref={`/api/pdf/gaji/${payroll.id}`}
        printLabel="Cetak rincian gaji"
        pdfLabel="Unduh PDF"
      />
      <PayrollDocument profile={db.profile} payroll={payroll} orderNumber={order?.number} />
    </div>
  );
}
