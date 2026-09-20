import Link from "next/link";
import { PayrollForm } from "@/components/payroll-form";
import { ButtonLink, PageHeader } from "@/components/shared";
import { readDb } from "@/lib/store";

export default async function GajiBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const db = await readDb();
  return (
    <div>
      <PageHeader
        eyebrow="Penggajian"
        title="Rincian baru"
        description="Tambah baris per orang atau per nota vendor. Total mengikuti volume pekerjaan, bukan gaji bulanan tetap."
        actions={
          <ButtonLink href="/gaji" variant="outline">
            Kembali
          </ButtonLink>
        }
      />
      {db.payees.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada penerima.{" "}
          <Link href="/gaji/penerima/baru" className="text-primary">
            Tambah pekerja atau vendor
          </Link>{" "}
          dulu.
        </p>
      ) : (
        <PayrollForm payees={db.payees} orders={db.orders} defaultOrderId={orderId} />
      )}
    </div>
  );
}
