import { notFound, redirect } from "next/navigation";
import { readDb } from "@/lib/store";

export default async function SuratJalanDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const sj = db.suratJalans.find((row) => row.id === id);
  if (!sj) notFound();
  if (sj.invoiceId) redirect(`/dokumen/invoice/${sj.invoiceId}`);
  redirect("/dokumen");
}
