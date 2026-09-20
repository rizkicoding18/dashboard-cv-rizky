import { redirect } from "next/navigation";
import { isIssued } from "@/lib/finance";
import { readDb } from "@/lib/store";

export default async function SuratJalanBaruRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string; orderId?: string }>;
}) {
  const { invoiceId, orderId } = await searchParams;
  const db = await readDb();

  if (invoiceId && db.invoices.some((row) => row.id === invoiceId)) {
    redirect(`/dokumen/invoice/${invoiceId}/sj/baru`);
  }

  if (orderId) {
    const invoices = db.invoices.filter((row) => row.orderId === orderId);
    const issued = invoices.find((row) => isIssued(row.status)) || invoices[0];
    if (issued) redirect(`/dokumen/invoice/${issued.id}/sj/baru`);
    redirect(`/dokumen/invoice/baru?orderId=${orderId}`);
  }

  redirect("/dokumen");
}
