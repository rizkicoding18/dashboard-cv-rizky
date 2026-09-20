import { formatMonth, formatRupiah, todayIso, formatDate } from "@/lib/format";
import type { CompanyProfile } from "@/lib/types";
import type { FinanceSummary } from "@/lib/finance";

function Row({
  label,
  hint,
  value,
  strong,
}: {
  label: string;
  hint?: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className={`doc-totals-line ${strong ? "doc-totals-grand" : ""}`}>
      <dt>
        {label}
        {hint ? <span className="doc-spec">{hint}</span> : null}
      </dt>
      <dd>{formatRupiah(value)}</dd>
    </div>
  );
}

export function LabaRugiDocument({
  profile,
  finance,
}: {
  profile: CompanyProfile;
  finance: FinanceSummary;
}) {
  const period = finance.period === "all" ? "Semua periode" : formatMonth(finance.period);
  return (
    <article className="doc-sheet">
      <header className="doc-header doc-header-brand">
        <div>
          <p className="doc-company-name">{profile.name}</p>
          <p className="doc-muted">{profile.city}</p>
        </div>
        <div className="doc-meta">
          <p className="doc-kicker">Laporan</p>
          <p className="doc-number">Laba rugi</p>
          <p className="doc-date">{period}</p>
        </div>
      </header>
      <p className="doc-body">
        Ringkasan uang masuk dari penjualan dan uang keluar untuk pekerjaan selama {period.toLowerCase()}. Dicetak{" "}
        {formatDate(todayIso())}.
      </p>
      <dl className="doc-totals" style={{ minWidth: "100%", marginTop: 24 }}>
        <Row label="Pendapatan" hint="Nilai faktur yang sudah terbit, tanpa PPN" value={finance.pendapatan} />
        <Row label="Modal barang (HPP)" hint="Harga pokok barang yang terjual" value={finance.hpp} />
        <Row label="Laba kotor" hint="Pendapatan dikurangi modal barang" value={finance.labaKotor} strong />
        <Row label="Beban operasional" hint="Sewa, listrik, dan biaya harian" value={finance.bebanOperasional} />
        <Row label="Upah pekerjaan" hint="Bayar orang sesuai volume kerja" value={finance.bebanUpah} />
        <Row label="Produksi luar" hint="Nota desain/cetak di perusahaan lain" value={finance.bebanProduksiLuar} />
        <Row label="Laba bersih" hint="Sisa setelah semua biaya" value={finance.labaBersih} strong />
      </dl>
    </article>
  );
}

export function NeracaDocument({
  profile,
  finance,
}: {
  profile: CompanyProfile;
  finance: FinanceSummary;
}) {
  return (
    <article className="doc-sheet">
      <header className="doc-header doc-header-brand">
        <div>
          <p className="doc-company-name">{profile.name}</p>
          <p className="doc-muted">{profile.city}</p>
        </div>
        <div className="doc-meta">
          <p className="doc-kicker">Laporan</p>
          <p className="doc-number">Neraca</p>
          <p className="doc-date">Posisi {formatDate(todayIso())}</p>
        </div>
      </header>
      <p className="doc-body">
        Gambar kondisi keuangan saat ini: apa yang dimiliki usaha, apa yang masih harus dibayar, dan sisa modal.
      </p>
      <section className="doc-split">
        <div>
          <p className="doc-label">Yang dimiliki (aktiva)</p>
          <dl className="doc-totals" style={{ minWidth: "100%", marginTop: 12 }}>
            <Row label="Kas & rekening" hint="Uang tunai dan bank" value={finance.kas} />
            <Row label="Piutang" hint="Tagihan ke pelanggan yang belum masuk" value={finance.piutang} />
            <Row label="Persediaan" hint="Nilai stok di gudang" value={finance.persediaan} />
            <Row label="Total aktiva" value={finance.aktiva} strong />
          </dl>
        </div>
        <div>
          <p className="doc-label">Sumber dana (pasiva)</p>
          <dl className="doc-totals" style={{ minWidth: "100%", marginTop: 12 }}>
            <Row label="Hutang pembelian" hint="Bahan yang belum dibayar" value={finance.hutang - finance.hutangGaji} />
            <Row label="Hutang gaji & nota" hint="Upah/nota vendor belum dibayar" value={finance.hutangGaji} />
            <Row label="PPN keluaran" hint="PPN di faktur terbit" value={finance.ppnKeluaran} />
            <Row label="Modal awal" value={finance.modal} />
            <Row label="Laba tahun ini" value={finance.labaTahun} />
            {finance.penyesuaian ? <Row label="Penyesuaian" value={finance.penyesuaian} /> : null}
            <Row label="Total pasiva" value={finance.kewajiban + finance.ekuitas} strong />
          </dl>
        </div>
      </section>
    </article>
  );
}
