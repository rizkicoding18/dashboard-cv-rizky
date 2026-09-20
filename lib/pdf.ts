import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import { invoiceDpp, invoicePpn, invoiceSubtotal, invoiceTotal } from "@/lib/finance";
import { dayName, formatDate, formatNumber, formatRupiah, terbilang } from "@/lib/format";
import type { BeritaAcara, CompanyProfile, Customer, Invoice, SuratJalan } from "@/lib/types";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LOGO_PATH = path.join(process.cwd(), "public/logo/logo.png");
const LOGO_SIZE = 48;
const MAROON = rgb(0.45, 0.12, 0.14);
const INK = rgb(0.14, 0.12, 0.11);
const MUTED = rgb(0.42, 0.4, 0.38);
const RULE = rgb(0.82, 0.8, 0.78);

type Align = "left" | "right" | "center";

type Column = { label: string; width: number; align?: Align };

function clean(value: string) {
  return value
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x00-\xFF]/g, "?");
}

function wrapLines(font: PDFFont, value: string, size: number, width: number) {
  const words = clean(value).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

class PdfWriter {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  logo: PDFImage | null;
  y: number;

  constructor(
    doc: PDFDocument,
    page: PDFPage,
    font: PDFFont,
    bold: PDFFont,
    italic: PDFFont,
    logo: PDFImage | null,
  ) {
    this.doc = doc;
    this.page = page;
    this.font = font;
    this.bold = bold;
    this.italic = italic;
    this.logo = logo;
    this.y = PAGE_H - MARGIN;
  }

  pickFont(bold?: boolean, italic?: boolean) {
    if (italic) return this.italic;
    if (bold) return this.bold;
    return this.font;
  }

  ensure(space = 56) {
    if (this.y < MARGIN + space) {
      this.page = this.doc.addPage([PAGE_W, PAGE_H]);
      this.y = PAGE_H - MARGIN;
    }
  }

  draw(
    value: string,
    {
      x = MARGIN,
      y = this.y,
      size = 10,
      bold = false,
      italic = false,
      color = INK,
      align = "left",
      width = CONTENT_W,
    }: {
      x?: number;
      y?: number;
      size?: number;
      bold?: boolean;
      italic?: boolean;
      color?: RGB;
      align?: Align;
      width?: number;
    } = {},
  ) {
    const font = this.pickFont(bold, italic);
    const text = clean(value);
    const textWidth = font.widthOfTextAtSize(text, size);
    let drawX = x;
    if (align === "right") drawX = x + width - textWidth;
    if (align === "center") drawX = x + (width - textWidth) / 2;
    this.page.drawText(text, { x: drawX, y, size, font, color });
  }

  drawTracked(
    value: string,
    {
      x = MARGIN,
      y = this.y,
      size = 9,
      tracking = 0.22,
      bold = true,
      color = INK,
      align = "right",
      width = CONTENT_W,
    }: {
      x?: number;
      y?: number;
      size?: number;
      tracking?: number;
      bold?: boolean;
      color?: RGB;
      align?: Align;
      width?: number;
    } = {},
  ) {
    const font = this.pickFont(bold);
    const text = clean(value).toUpperCase();
    const gap = size * tracking;
    const total =
      [...text].reduce((sum, char) => sum + font.widthOfTextAtSize(char, size), 0) +
      gap * Math.max(0, text.length - 1);
    let cursor = x;
    if (align === "right") cursor = x + width - total;
    if (align === "center") cursor = x + (width - total) / 2;
    for (const char of text) {
      this.page.drawText(char, { x: cursor, y, size, font, color });
      cursor += font.widthOfTextAtSize(char, size) + gap;
    }
  }

  gap(size = 12) {
    this.y -= size;
  }

  rule(color = INK, thickness = 1) {
    this.ensure(10);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness,
      color,
    });
    this.y -= 12;
  }

  paragraph(
    value: string,
    {
      x = MARGIN,
      width = CONTENT_W,
      size = 10,
      leading = 14,
      bold = false,
      italic = false,
      color = INK,
    } = {},
  ) {
    const font = this.pickFont(bold, italic);
    for (const line of wrapLines(font, value, size, width)) {
      this.ensure(leading);
      this.draw(line, { x, size, bold, italic, color, width });
      this.y -= leading;
    }
  }

  companyAndMeta(
    profile: CompanyProfile,
    meta: { title: string; titleColor?: RGB; number: string; lines: string[] },
  ) {
    const top = this.y;
    const metaW = 190;
    const leftW = CONTENT_W - metaW - 16;
    const textX = this.logo ? MARGIN + LOGO_SIZE + 10 : MARGIN;
    const textW = leftW - (this.logo ? LOGO_SIZE + 10 : 0);

    if (this.logo) {
      this.page.drawImage(this.logo, {
        x: MARGIN,
        y: top - LOGO_SIZE + 12,
        width: LOGO_SIZE,
        height: LOGO_SIZE,
      });
    }

    let leftY = top;
    for (const line of wrapLines(this.bold, profile.name, 18, textW)) {
      this.draw(line, { x: textX, y: leftY, size: 18, bold: true, width: textW });
      leftY -= 20;
    }
    if (profile.tagline) {
      for (const line of wrapLines(this.font, profile.tagline, 9, textW)) {
        this.draw(line, { x: textX, y: leftY, size: 9, color: MUTED, width: textW });
        leftY -= 12;
      }
    }
    leftY -= 2;
    for (const line of [
      profile.address,
      profile.city,
      `${profile.phone} · ${profile.email}`,
      profile.npwp ? `NPWP ${profile.npwp}` : "",
    ].filter(Boolean)) {
      this.draw(line, { x: textX, y: leftY, size: 8, color: MUTED, width: textW });
      leftY -= 11;
    }

    const metaX = MARGIN + leftW + 16;
    let rightY = top;
    this.drawTracked(meta.title, {
      x: metaX,
      y: rightY,
      size: 9,
      color: meta.titleColor ?? INK,
      align: "right",
      width: metaW,
    });
    rightY -= 18;
    this.draw(meta.number, { x: metaX, y: rightY, size: 11, bold: true, align: "right", width: metaW });
    rightY -= 16;
    for (const line of meta.lines) {
      this.draw(line, { x: metaX, y: rightY, size: 9, color: MUTED, align: "right", width: metaW });
      rightY -= 12;
    }

    this.y = Math.min(leftY, rightY, top - LOGO_SIZE - 8) - 8;
  }

  twoCol(left: string[], right: string[] = [], rightHasLabel = true) {
    const top = this.y;
    const colW = (CONTENT_W - 16) / 2;
    let leftY = top;
    for (const [index, line] of left.entries()) {
      const muted = index === 0;
      this.draw(muted ? line.toUpperCase() : line, {
        x: MARGIN,
        y: leftY,
        size: muted ? 8 : 10,
        bold: index === 1,
        color: muted ? MUTED : INK,
        width: colW,
      });
      leftY -= index === 0 ? 12 : 13;
    }
    let rightY = top;
    for (const [index, line] of right.entries()) {
      const muted = rightHasLabel && index === 0;
      this.draw(muted ? line.toUpperCase() : line, {
        x: MARGIN + colW + 16,
        y: rightY,
        size: muted ? 8 : 10,
        bold: rightHasLabel && index === 1,
        color: muted ? MUTED : INK,
        align: "right",
        width: colW,
      });
      rightY -= muted ? 12 : 13;
    }
    this.y = Math.min(leftY, rightY) - 8;
  }

  table(columns: Column[], rows: string[][]) {
    const pad = 8;
    const headerSize = 9;
    const cellSize = 9;
    this.ensure(36);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y + 12 },
      end: { x: PAGE_W - MARGIN, y: this.y + 12 },
      thickness: 1,
      color: INK,
    });
    let x = MARGIN;
    for (const col of columns) {
      this.draw(col.label, {
        x: x + (col.align === "right" ? 0 : pad),
        size: headerSize,
        bold: true,
        align: col.align,
        width: col.width - pad,
      });
      x += col.width;
    }
    this.y -= 10;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y + 8 },
      end: { x: PAGE_W - MARGIN, y: this.y + 8 },
      thickness: 1,
      color: INK,
    });
    this.y -= 8;

    for (const row of rows) {
      const wrapped = columns.map((col, index) =>
        wrapLines(this.font, row[index] || "", cellSize, col.width - pad * 2),
      );
      const rowHeight = Math.max(22, ...wrapped.map((lines) => lines.length * 13 + 8));
      this.ensure(rowHeight + 8);
      let cx = MARGIN;
      columns.forEach((col, index) => {
        wrapped[index].forEach((line, lineIndex) => {
          this.draw(line, {
            x: cx + (col.align === "right" ? 0 : pad),
            y: this.y - lineIndex * 13,
            size: cellSize,
            align: col.align,
            width: col.width - pad,
          });
        });
        cx += col.width;
      });
      this.y -= rowHeight;
      this.page.drawLine({
        start: { x: MARGIN, y: this.y + 8 },
        end: { x: PAGE_W - MARGIN, y: this.y + 8 },
        thickness: 0.5,
        color: RULE,
      });
    }
    this.y -= 18;
  }

  totalsAndNotes(invoice: Invoice, extra: string[]) {
    const subtotal = invoiceSubtotal(invoice.items);
    const dpp = invoiceDpp(invoice);
    const ppn = invoicePpn(invoice);
    const total = invoiceTotal(invoice);
    const boxW = 200;
    const boxX = PAGE_W - MARGIN - boxW;
    const top = this.y;
    const rows: [string, string, boolean?][] = [
      ["Subtotal", formatRupiah(subtotal)],
      ...(invoice.discount ? [["Diskon", `- ${formatRupiah(invoice.discount)}`] as [string, string]] : []),
      ["DPP", formatRupiah(dpp)],
      ...(invoice.includePpn
        ? [[`PPN ${Math.round(invoice.ppnRate * 100)}%`, formatRupiah(ppn)] as [string, string]]
        : []),
      ["Total", formatRupiah(total), true],
    ];
    let rightY = top;
    for (const [label, value, strong] of rows) {
      if (strong) {
        this.page.drawLine({
          start: { x: boxX, y: rightY + 10 },
          end: { x: PAGE_W - MARGIN, y: rightY + 10 },
          thickness: 1,
          color: INK,
        });
        rightY -= 4;
      }
      this.draw(label, { x: boxX, y: rightY, size: strong ? 11 : 10, bold: Boolean(strong), width: 80 });
      this.draw(value, {
        x: boxX + 80,
        y: rightY,
        size: strong ? 11 : 10,
        bold: Boolean(strong),
        align: "right",
        width: 120,
      });
      rightY -= 14;
    }

    this.y = top;
    this.draw("TERBILANG", { size: 8, bold: true, color: MUTED, width: CONTENT_W - boxW - 24 });
    this.y -= 13;
    this.paragraph(terbilang(total), {
      width: CONTENT_W - boxW - 24,
      size: 9,
      leading: 13,
      italic: true,
    });
    for (const line of extra.filter(Boolean)) {
      this.y -= 6;
      this.paragraph(line, { width: CONTENT_W - boxW - 24, size: 9, leading: 13, color: MUTED });
    }
    this.y = Math.min(this.y, rightY) - 8;
    return total;
  }

  signatures(
    left: { heading: string[]; name: string; sub?: string },
    right: { heading: string[]; name: string; sub?: string },
  ) {
    this.gap(64);
    this.ensure(130);
    const top = this.y;
    const colW = CONTENT_W / 2;
    const drawCol = (x: number, col: { heading: string[]; name: string; sub?: string }) => {
      let y = top;
      for (const line of col.heading) {
        this.draw(line, { x, y, size: 10, align: "center", width: colW });
        y -= 13;
      }
      y -= 72;
      this.draw(col.name, { x, y, size: 10, bold: true, align: "center", width: colW });
      y -= 13;
      if (col.sub) {
        this.draw(col.sub, { x, y, size: 8, color: MUTED, align: "center", width: colW });
        y -= 12;
      }
      return y;
    };
    const leftY = drawCol(MARGIN, left);
    const rightY = drawCol(MARGIN + colW, right);
    this.y = Math.min(leftY, rightY);
  }
}

async function createWriter() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  let logo: PDFImage | null = null;
  try {
    logo = await doc.embedPng(await readFile(LOGO_PATH));
  } catch {
    logo = null;
  }
  const page = doc.addPage([PAGE_W, PAGE_H]);
  return { doc, writer: new PdfWriter(doc, page, font, bold, italic, logo) };
}

const PRICE_COLS: Column[] = [
  { label: "No", width: 28 },
  { label: "Uraian", width: 176 },
  { label: "Qty", width: 52, align: "right" },
  { label: "Sat", width: 50 },
  { label: "Harga", width: 96, align: "right" },
  { label: "Jumlah", width: 97, align: "right" },
];

function priceRows(invoice: Invoice) {
  return invoice.items.map((item, index) => [
    String(index + 1),
    item.spec ? `${item.name} (${item.spec})` : item.name,
    formatNumber(item.qty),
    item.unit,
    formatRupiah(item.unitPrice),
    formatRupiah(item.qty * item.unitPrice),
  ]);
}

function paymentNotes(profile: CompanyProfile, notes: string) {
  return [
    notes,
    profile.bankAccount
      ? `Pembayaran ke ${profile.bankName} ${profile.bankAccount} a.n. ${profile.bankHolder}`
      : "",
  ];
}

export async function invoicePdf(profile: CompanyProfile, customer: Customer, invoice: Invoice) {
  const { doc, writer } = await createWriter();
  writer.companyAndMeta(profile, {
    title: "INVOICE",
    titleColor: MAROON,
    number: invoice.number,
    lines: [
      `Tanggal: ${formatDate(invoice.date)}`,
      invoice.dueDate ? `Jatuh tempo: ${formatDate(invoice.dueDate)}` : "",
      invoice.fakturNumber ? `Faktur ${invoice.fakturNumber}` : "",
    ].filter(Boolean),
  });
  writer.rule(MAROON, 3);
  writer.gap(10);
  writer.twoCol(
    [
      "Ditagihkan kepada",
      customer.name,
      customer.pic ? `u.p. ${customer.pic}` : "",
      customer.address,
      customer.npwp ? `NPWP ${customer.npwp}` : "",
    ].filter(Boolean),
    ["Status", invoice.status.toUpperCase()],
  );
  writer.gap(8);
  writer.table(PRICE_COLS, priceRows(invoice));
  writer.totalsAndNotes(invoice, paymentNotes(profile, invoice.notes));
  writer.signatures(
    { heading: ["Pemesan"], name: customer.pic || customer.name },
    {
      heading: [`${profile.city.split(",")[0]}, ${formatDate(invoice.date)}`, profile.ownerTitle],
      name: profile.owner,
    },
  );
  return doc.save();
}

export async function fakturPdf(profile: CompanyProfile, customer: Customer, invoice: Invoice) {
  const { doc, writer } = await createWriter();
  writer.companyAndMeta(profile, {
    title: "FAKTUR PENJUALAN",
    number: invoice.fakturNumber || invoice.number,
    lines: [
      `Tanggal: ${formatDate(invoice.date)}`,
      invoice.dueDate ? `Jatuh tempo: ${formatDate(invoice.dueDate)}` : "",
      `Invoice ${invoice.number}`,
    ].filter(Boolean),
  });
  writer.rule();
  writer.twoCol(
    [
      "Kepada",
      customer.name,
      customer.pic ? `u.p. ${customer.pic}` : "",
      customer.address,
      customer.npwp ? `NPWP ${customer.npwp}` : "",
    ].filter(Boolean),
    ["Pengusaha kena pajak", profile.name, profile.npwp ? `NPWP ${profile.npwp}` : ""].filter(Boolean),
  );
  writer.gap(8);
  writer.table(PRICE_COLS, priceRows(invoice));
  writer.totalsAndNotes(invoice, paymentNotes(profile, invoice.notes));
  writer.signatures(
    { heading: ["Penerima"], name: customer.pic || customer.name },
    {
      heading: [`${profile.city.split(",")[0]}, ${formatDate(invoice.date)}`, profile.ownerTitle],
      name: profile.owner,
    },
  );
  return doc.save();
}

export async function baPdf(profile: CompanyProfile, customer: Customer, ba: BeritaAcara) {
  const { doc, writer } = await createWriter();
  if (writer.logo) {
    writer.page.drawImage(writer.logo, {
      x: (PAGE_W - 56) / 2,
      y: writer.y - 44,
      width: 56,
      height: 56,
    });
    writer.y -= 64;
  }
  writer.drawTracked("Berita acara", { size: 9, align: "center", color: INK, tracking: 0.25 });
  writer.gap(16);
  writer.draw(ba.title, { size: 18, bold: true, align: "center" });
  writer.gap(18);
  writer.draw(ba.number, { size: 10, color: MUTED, align: "center" });
  writer.gap(28);
  writer.paragraph(
    `Pada hari ${dayName(ba.date)} tanggal ${formatDate(ba.date)}${customer.name ? `, di ${customer.name}` : ""}, telah dilakukan serah terima barang/pekerjaan dengan rincian sebagai berikut:`,
    { size: 10, leading: 15 },
  );
  if (ba.description) {
    writer.gap(6);
    writer.paragraph(ba.description, { size: 10, leading: 15 });
  }
  writer.gap(4);
  writer.table(
    [
      { label: "No", width: 28 },
      { label: "Uraian", width: 214 },
      { label: "Qty", width: 52, align: "right" },
      { label: "Sat", width: 50 },
      { label: "Kondisi", width: 155 },
    ],
    ba.items.map((item, index) => [
      String(index + 1),
      item.spec ? `${item.name} (${item.spec})` : item.name,
      formatNumber(item.qty),
      item.unit,
      item.condition,
    ]),
  );
  if (ba.notes) writer.paragraph(ba.notes, { size: 9, leading: 13, color: MUTED });
  writer.gap(8);
  writer.paragraph("Demikian berita acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.", {
    size: 10,
    leading: 15,
  });
  writer.signatures(
    { heading: [""], name: "" },
    {
      heading: ["Pihak Pertama", profile.name],
      name: profile.owner,
      sub: profile.ownerTitle,
    },
  );
  return doc.save();
}

export async function sjPdf(profile: CompanyProfile, customer: Customer, sj: SuratJalan) {
  const { doc, writer } = await createWriter();
  writer.companyAndMeta(profile, {
    title: "SURAT JALAN",
    number: sj.number,
    lines: [`Tanggal: ${formatDate(sj.date)}`],
  });
  writer.rule();
  writer.twoCol(
    [
      "Tujuan",
      customer.name,
      customer.pic ? `u.p. ${customer.pic}` : "",
      sj.destination || customer.address,
    ].filter(Boolean),
    [sj.vehicle ? `Kendaraan: ${sj.vehicle}` : "", sj.driver ? `Pengemudi: ${sj.driver}` : ""].filter(Boolean),
    false,
  );
  writer.gap(8);
  writer.table(
    [
      { label: "No", width: 28 },
      { label: "Uraian", width: 214 },
      { label: "Qty", width: 52, align: "right" },
      { label: "Sat", width: 50 },
      { label: "Keterangan", width: 155 },
    ],
    sj.items.map((item, index) => [
      String(index + 1),
      item.spec ? `${item.name} (${item.spec})` : item.name,
      formatNumber(item.qty),
      item.unit,
      item.notes || "-",
    ]),
  );
  if (sj.notes) writer.paragraph(sj.notes, { size: 9, leading: 13, color: MUTED });
  writer.signatures(
    { heading: ["Penerima", customer.name], name: customer.pic || customer.name },
    { heading: ["Pengirim", profile.name], name: profile.owner, sub: profile.ownerTitle },
  );
  return doc.save();
}

export function pdfFilename(number: string, kind: string) {
  return `${kind}-${number.replaceAll("/", "-")}.pdf`;
}
