import { ResetDemoButton, SettingsForm } from "@/components/money-forms";
import { PageHeader } from "@/components/shared";
import { readDb } from "@/lib/store";

export default async function PengaturanPage() {
  const db = await readDb();
  return (
    <div className="grid max-w-3xl gap-6">
      <PageHeader
        eyebrow="Usaha"
        title="Pengaturan"
        description="Identitas ini muncul di invoice, faktur, surat jalan, dan berita acara. Rekening pembayaran diatur di menu Bank."
      />
      <SettingsForm profile={db.profile} />
      <div className="rounded-2xl border border-border bg-muted/40 p-5">
        <h2 className="font-heading text-xl">Login dashboard</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Akses dibatasi nama pengguna dan kata sandi. Atur lewat <code>AUTH_USERNAME</code>,{" "}
          <code>AUTH_PASSWORD</code>, dan <code>AUTH_SECRET</code> di berkas lingkungan. Default lokal:{" "}
          <code>admin</code> / <code>rizky</code>.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-muted/40 p-5">
        <h2 className="font-heading text-xl">Data contoh</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Dashboard ini menyimpan data di berkas lokal <code>data/db.json</code>. Gunakan tombol ini jika ingin
          mengembalikan isi demo percetakan.
        </p>
        <div className="mt-4">
          <ResetDemoButton />
        </div>
      </div>
    </div>
  );
}
