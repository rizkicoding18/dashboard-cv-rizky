import { notFound } from "next/navigation";
import { NeracaDocument } from "@/components/finance-reports";
import { PrintToolbar } from "@/components/document-actions";
import { computeFinance } from "@/lib/finance";
import { currentMonthKey } from "@/lib/format";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CetakNeracaPage({
  params,
}: {
  params: Promise<{ periode: string }>;
}) {
  const { periode } = await params;
  const month = periode || currentMonthKey();
  if (!/^\d{4}-\d{2}$/.test(month)) notFound();
  const db = await readDb();
  const finance = computeFinance(db, month);

  return (
    <div className="min-h-full bg-stone-100 py-6 print:bg-white print:py-0">
      <PrintToolbar
        backHref={`/keuangan?periode=${month}`}
        pdfHref={`/api/pdf/neraca/${month}`}
        printLabel="Cetak neraca"
        pdfLabel="Unduh PDF"
      />
      <NeracaDocument profile={db.profile} finance={finance} />
    </div>
  );
}
