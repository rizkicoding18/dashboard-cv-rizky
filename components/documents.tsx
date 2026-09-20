import { formatDate, formatNumber, formatRupiah, terbilang, dayName } from "@/lib/format";
import { invoiceDpp, invoicePpn, invoiceSubtotal } from "@/lib/finance";
import { formatBankLine } from "@/lib/banks";
import type { BankAccount, BeritaAcara, CompanyProfile, Customer, Invoice, Payroll, Quotation, SuratJalan } from "@/lib/types";
import { PAYEE_KIND_LABEL, WORK_TYPE_LABEL, payrollItemAmount, payrollKindTotal, payrollTotal } from "@/lib/payroll";
import { QUOTATION_KIND_LABEL } from "@/lib/quotations";

export const COMPANY_LOGO_SRC = "/logo/logo.png";

function BrandLogo({
  alt = "",
  className,
  size = 64,
}: {
  alt?: string;
  className?: string;
  size?: number;
}) {
  return (
    // Native img so print/PDF pages keep the mark without next/image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={COMPANY_LOGO_SRC} alt={alt} width={size} height={size} className={className ?? "doc-logo"} />
  );
}

function CompanyBlock({ profile }: { profile: CompanyProfile }) {
  return (
    <div className="doc-company">
      <BrandLogo />
      <div>
        <p className="doc-company-name">{profile.name}</p>
        {profile.tagline ? <p className="doc-tagline">{profile.tagline}</p> : null}
        <p className="doc-company-meta">
          {profile.address}
          <br />
          {profile.city}
          <br />
          {profile.phone} · {profile.email}
          {profile.npwp ? (
            <>
              <br />
              NPWP {profile.npwp}
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function LineTable({
  items,
  showPrice,
}: {
  items: { id: string; name: string; spec: string; qty: number; unit: string; unitPrice?: number; notes?: string }[];
  showPrice?: boolean;
}) {
  return (
    <table className="doc-table">
      <thead>
        <tr>
          <th className="col-no">No</th>
          <th>Uraian</th>
          <th className="col-qty">Qty</th>
          <th className="col-sat">Sat</th>
          {showPrice ? (
            <>
              <th className="col-price">Harga</th>
              <th className="col-amount">Jumlah</th>
            </>
          ) : (
            <th className="col-note">Keterangan</th>
          )}
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={item.id}>
            <td className="col-no">{index + 1}</td>
            <td>
              <span className="doc-item-name">{item.name}</span>
              {item.spec ? <span className="doc-spec">{item.spec}</span> : null}
            </td>
            <td className="col-qty">{formatNumber(item.qty)}</td>
            <td className="col-sat">{item.unit}</td>
            {showPrice ? (
              <>
                <td className="col-price">{formatRupiah(item.unitPrice || 0)}</td>
                <td className="col-amount">{formatRupiah(item.qty * (item.unitPrice || 0))}</td>
              </>
            ) : (
              <td className="col-note">{item.notes || "—"}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TotalsBlock({
  invoice,
  bank,
  showBank = true,
}: {
  invoice: Pick<Invoice, "items" | "discount" | "includePpn" | "ppnRate" | "notes">;
  bank?: BankAccount | null;
  showBank?: boolean;
}) {
  const subtotal = invoiceSubtotal(invoice.items);
  const dpp = invoiceDpp(invoice);
  const ppn = invoicePpn(invoice);
  const total = dpp + ppn;
  const bankLine = showBank ? formatBankLine(bank) : "";

  return (
    <section className="doc-totals-wrap">
      <div className="doc-notes">
        <p className="doc-label">Terbilang</p>
        <p className="doc-terbilang">{terbilang(total)}</p>
        {invoice.notes ? <p className="doc-note-block">{invoice.notes}</p> : null}
        {bankLine ? <p className="doc-bank">{bankLine}</p> : null}
      </div>
      <dl className="doc-totals">
        <div className="doc-totals-line">
          <dt>Subtotal</dt>
          <dd>{formatRupiah(subtotal)}</dd>
        </div>
        {invoice.discount ? (
          <div className="doc-totals-line">
            <dt>Diskon</dt>
            <dd>- {formatRupiah(invoice.discount)}</dd>
          </div>
        ) : null}
        <div className="doc-totals-line">
          <dt>DPP</dt>
          <dd>{formatRupiah(dpp)}</dd>
        </div>
        {invoice.includePpn ? (
          <div className="doc-totals-line">
            <dt>PPN {Math.round(invoice.ppnRate * 100)}%</dt>
            <dd>{formatRupiah(ppn)}</dd>
          </div>
        ) : null}
        <div className="doc-totals-grand">
          <dt>Total</dt>
          <dd>{formatRupiah(total)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function InvoiceDocument({
  profile,
  customer,
  invoice,
  bank,
}: {
  profile: CompanyProfile;
  customer: Customer;
  invoice: Invoice;
  bank?: BankAccount | null;
}) {
  return (
    <article className="doc-sheet">
      <header className="doc-header doc-header-brand">
        <CompanyBlock profile={profile} />
        <div className="doc-meta">
          <p className="doc-kicker">Invoice</p>
          <p className="doc-number">{invoice.number}</p>
          <p className="doc-date">Tanggal: {formatDate(invoice.date)}</p>
          {invoice.dueDate ? <p className="doc-date">Jatuh tempo: {formatDate(invoice.dueDate)}</p> : null}
          {invoice.fakturNumber ? <p className="doc-muted">Faktur {invoice.fakturNumber}</p> : null}
        </div>
      </header>

      <section className="doc-split">
        <div>
          <p className="doc-label">Ditagihkan kepada</p>
          <p className="doc-party-name">{customer.name}</p>
          {customer.pic ? <p className="doc-party-line">u.p. {customer.pic}</p> : null}
          <p className="doc-party-address">{customer.address}</p>
        </div>
        <div className="doc-right">
          <p className="doc-label">Status</p>
          <p className="doc-party-name doc-status">{invoice.status}</p>
        </div>
      </section>

      <LineTable items={invoice.items} showPrice />
      <TotalsBlock invoice={invoice} bank={bank} />

      <footer className="doc-signs">
        <div>
          <p>Pemesan</p>
          <div className="doc-sign-space" />
          <p className="doc-sign-name">{customer.pic || customer.name}</p>
        </div>
        <div>
          <p>
            {profile.city.split(",")[0]}, {formatDate(invoice.date)}
          </p>
          <p>{profile.ownerTitle}</p>
          <div className="doc-sign-space" />
          <p className="doc-sign-name">{profile.owner}</p>
        </div>
      </footer>
    </article>
  );
}

export function FakturDocument({
  profile,
  customer,
  invoice,
  bank,
}: {
  profile: CompanyProfile;
  customer: Customer;
  invoice: Invoice;
  bank?: BankAccount | null;
}) {
  return (
    <article className="doc-sheet">
      <header className="doc-header doc-header-plain">
        <CompanyBlock profile={profile} />
        <div className="doc-meta">
          <p className="doc-kicker doc-kicker-ink">Faktur penjualan</p>
          <p className="doc-number">{invoice.fakturNumber || invoice.number}</p>
          <p className="doc-date">Tanggal: {formatDate(invoice.date)}</p>
          {invoice.dueDate ? <p className="doc-date">Jatuh tempo: {formatDate(invoice.dueDate)}</p> : null}
          <p className="doc-muted">Invoice {invoice.number}</p>
        </div>
      </header>

      <section className="doc-split">
        <div>
          <p className="doc-label">Kepada</p>
          <p className="doc-party-name">{customer.name}</p>
          {customer.pic ? <p className="doc-party-line">u.p. {customer.pic}</p> : null}
          <p className="doc-party-address">{customer.address}</p>
        </div>
        <div className="doc-right">
          <p className="doc-label">Pengusaha kena pajak</p>
          <p className="doc-party-name">{profile.name}</p>
          {profile.npwp ? <p className="doc-party-line">NPWP {profile.npwp}</p> : null}
        </div>
      </section>

      <LineTable items={invoice.items} showPrice />
      <TotalsBlock invoice={invoice} bank={bank} />

      <footer className="doc-signs">
        <div>
          <p>Penerima</p>
          <div className="doc-sign-space" />
          <p className="doc-sign-name">{customer.pic || customer.name}</p>
        </div>
        <div>
          <p>
            {profile.city.split(",")[0]}, {formatDate(invoice.date)}
          </p>
          <p>{profile.ownerTitle}</p>
          <div className="doc-sign-space" />
          <p className="doc-sign-name">{profile.owner}</p>
        </div>
      </footer>
    </article>
  );
}

export function BeritaAcaraDocument({
  profile,
  customer,
  ba,
}: {
  profile: CompanyProfile;
  customer: Customer;
  ba: BeritaAcara;
}) {
  return (
    <article className="doc-sheet">
      <header className="doc-center">
        <BrandLogo className="doc-logo-center" />
        <p className="doc-kicker doc-kicker-ink">Berita acara</p>
        <h1 className="doc-title">{ba.title}</h1>
        <p className="doc-number">{ba.number}</p>
      </header>
      <p className="doc-body">
        {`Pada hari ${dayName(ba.date)} tanggal ${formatDate(ba.date)}${customer.name ? `, di ${customer.name}` : ""}, telah dilakukan serah terima barang/pekerjaan dengan rincian sebagai berikut:`}
      </p>
      {ba.description ? <p className="doc-body">{ba.description}</p> : null}
      <table className="doc-table">
        <thead>
          <tr>
            <th className="col-no">No</th>
            <th>Uraian</th>
            <th className="col-qty">Qty</th>
            <th className="col-sat">Sat</th>
            <th className="col-note">Kondisi</th>
          </tr>
        </thead>
        <tbody>
          {ba.items.map((item, index) => (
            <tr key={item.id}>
              <td className="col-no">{index + 1}</td>
              <td>
                {item.name}
                {item.spec ? <span className="doc-spec">{item.spec}</span> : null}
              </td>
              <td className="col-qty">{formatNumber(item.qty)}</td>
              <td className="col-sat">{item.unit}</td>
              <td className="col-note">{item.condition}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ba.notes ? <p className="doc-note-block">{ba.notes}</p> : null}
      <p className="doc-body">
        Demikian berita acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
      </p>
      <footer className="doc-signs">
        <div />
        <div>
          <p>Pihak Pertama</p>
          <p className="doc-muted">{profile.name}</p>
          <div className="doc-sign-space" />
          <p className="doc-sign-name">{profile.owner}</p>
          <p className="doc-muted">{profile.ownerTitle}</p>
        </div>
      </footer>
    </article>
  );
}

export function SuratJalanDocument({
  profile,
  customer,
  sj,
}: {
  profile: CompanyProfile;
  customer: Customer;
  sj: SuratJalan;
}) {
  return (
    <article className="doc-sheet">
      <header className="doc-header doc-header-plain">
        <CompanyBlock profile={profile} />
        <div className="doc-meta">
          <p className="doc-kicker doc-kicker-ink">Surat jalan</p>
          <p className="doc-number">{sj.number}</p>
          <p className="doc-date">Tanggal: {formatDate(sj.date)}</p>
        </div>
      </header>
      <section className="doc-split">
        <div>
          <p className="doc-label">Tujuan</p>
          <p className="doc-party-name">{customer.name}</p>
          {customer.pic ? <p className="doc-party-line">u.p. {customer.pic}</p> : null}
          <p className="doc-party-address">{sj.destination || customer.address}</p>
        </div>
        <div className="doc-right">
          {sj.vehicle ? <p className="doc-party-line">Kendaraan: {sj.vehicle}</p> : null}
          {sj.driver ? <p className="doc-party-line">Pengemudi: {sj.driver}</p> : null}
        </div>
      </section>
      <LineTable
        items={sj.items.map((item) => ({
          id: item.id,
          name: item.name,
          spec: item.spec,
          qty: item.qty,
          unit: item.unit,
          notes: item.notes,
        }))}
      />
      {sj.notes ? <p className="doc-note-block">{sj.notes}</p> : null}
      <footer className="doc-signs">
        <div>
          <p>Penerima</p>
          <p className="doc-muted">{customer.name}</p>
          <div className="doc-sign-space" />
          <p className="doc-sign-name">{customer.pic || customer.name}</p>
        </div>
        <div>
          <p>Pengirim</p>
          <p className="doc-muted">{profile.name}</p>
          <div className="doc-sign-space" />
          <p className="doc-sign-name">{profile.owner}</p>
          <p className="doc-muted">{profile.ownerTitle}</p>
        </div>
      </footer>
    </article>
  );
}

export function QuotationDocument({
  profile,
  customer,
  quotation,
  sourceNumber,
}: {
  profile: CompanyProfile;
  customer: Customer;
  quotation: Quotation;
  sourceNumber?: string | null;
}) {
  const title = QUOTATION_KIND_LABEL[quotation.kind];
  const city = profile.city.split(",")[0];
  return (
    <article className="doc-sheet">
      <header className="doc-header doc-header-brand">
        <CompanyBlock profile={profile} />
        <div className="doc-meta">
          <p className="doc-kicker">{title}</p>
          <p className="doc-number">{quotation.number}</p>
          <p className="doc-date">Tanggal: {formatDate(quotation.date)}</p>
          {quotation.validUntil ? <p className="doc-date">Berlaku s.d. {formatDate(quotation.validUntil)}</p> : null}
          {sourceNumber ? <p className="doc-muted">Mengacu {sourceNumber}</p> : null}
        </div>
      </header>

      <table className="doc-ref">
        <tbody>
          <tr>
            <td>Nomor</td>
            <td>: {quotation.number}</td>
          </tr>
          <tr>
            <td>Lampiran</td>
            <td>: 1 (satu) berkas</td>
          </tr>
          <tr>
            <td>Perihal</td>
            <td>: {quotation.subject || title}</td>
          </tr>
        </tbody>
      </table>

      <section className="doc-split">
        <div>
          <p className="doc-label">Kepada Yth.</p>
          <p className="doc-party-name">{customer.name}</p>
          {customer.pic ? <p className="doc-party-line">u.p. {customer.pic}</p> : null}
          <p className="doc-party-address">{customer.address}</p>
          <p className="doc-party-line">di tempat</p>
        </div>
      </section>

      {quotation.intro ? <p className="doc-body doc-pre">{quotation.intro}</p> : null}
      <LineTable items={quotation.items} showPrice />
      <TotalsBlock invoice={quotation} showBank={false} />
      <p className="doc-body">
        Demikian penawaran ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.
      </p>
      <footer className="doc-signs">
        <div />
        <div>
          <p>
            {city}, {formatDate(quotation.date)}
          </p>
          <p>Hormat kami,</p>
          <p className="doc-muted">{profile.name}</p>
          <div className="doc-sign-space" />
          <p className="doc-sign-name">{profile.owner}</p>
          <p className="doc-muted">{profile.ownerTitle}</p>
        </div>
      </footer>
    </article>
  );
}

export function PayrollDocument({
  profile,
  payroll,
  orderNumber,
}: {
  profile: CompanyProfile;
  payroll: Payroll;
  orderNumber?: string | null;
}) {
  const total = payrollTotal(payroll);
  const upah = payrollKindTotal(payroll, "pekerja");
  const nota = payrollKindTotal(payroll, "vendor");
  const city = profile.city.split(",")[0];
  return (
    <article className="doc-sheet">
      <header className="doc-header doc-header-brand">
        <CompanyBlock profile={profile} />
        <div className="doc-meta">
          <p className="doc-kicker">Rincian penggajian</p>
          <p className="doc-number">{payroll.number}</p>
          <p className="doc-date">Tanggal: {formatDate(payroll.date)}</p>
          {orderNumber ? <p className="doc-muted">Order {orderNumber}</p> : null}
        </div>
      </header>
      <p className="doc-body">
        Upah mengikuti jumlah orang dan volume pekerjaan. Nota dari perusahaan luar (desain, cetak, dan sejenisnya)
        dicatat pada baris vendor.
      </p>
      <table className="doc-table">
        <thead>
          <tr>
            <th className="col-no">No</th>
            <th>Penerima</th>
            <th>Pekerjaan</th>
            <th className="col-qty">Qty</th>
            <th className="col-sat">Sat</th>
            <th className="col-price">Tarif</th>
            <th className="col-amount">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {payroll.items.map((item, index) => (
            <tr key={item.id}>
              <td className="col-no">{index + 1}</td>
              <td>
                <span className="doc-item-name">{item.payeeName}</span>
                <span className="doc-spec">
                  {PAYEE_KIND_LABEL[item.kind]}
                  {item.description ? ` · ${item.description}` : ""}
                </span>
              </td>
              <td>{WORK_TYPE_LABEL[item.workType]}</td>
              <td className="col-qty">{formatNumber(item.qty)}</td>
              <td className="col-sat">{item.unit}</td>
              <td className="col-price">{formatRupiah(item.rate)}</td>
              <td className="col-amount">{formatRupiah(payrollItemAmount(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="doc-totals-wrap">
        <div className="doc-notes">
          <p className="doc-label">Terbilang</p>
          <p className="doc-terbilang">{terbilang(total)}</p>
          {payroll.notes ? <p className="doc-note-block">{payroll.notes}</p> : null}
        </div>
        <dl className="doc-totals">
          <div className="doc-totals-line">
            <dt>Upah pekerja</dt>
            <dd>{formatRupiah(upah)}</dd>
          </div>
          <div className="doc-totals-line">
            <dt>Nota produksi luar</dt>
            <dd>{formatRupiah(nota)}</dd>
          </div>
          <div className="doc-totals-grand">
            <dt>Total</dt>
            <dd>{formatRupiah(total)}</dd>
          </div>
        </dl>
      </section>
      <footer className="doc-signs">
        <div>
          <p>Diterima</p>
          <div className="doc-sign-space" />
          <p className="doc-sign-name">................</p>
        </div>
        <div>
          <p>
            {city}, {formatDate(payroll.date)}
          </p>
          <p>{profile.ownerTitle}</p>
          <div className="doc-sign-space" />
          <p className="doc-sign-name">{profile.owner}</p>
        </div>
      </footer>
    </article>
  );
}
