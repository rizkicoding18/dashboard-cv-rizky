import { createElement } from "react";
import { requireSession } from "@/lib/auth";
import { resolveBank } from "@/lib/banks";
import {
  BeritaAcaraDocument,
  FakturDocument,
  InvoiceDocument,
  PayrollDocument,
  QuotationDocument,
  SuratJalanDocument,
} from "@/components/documents";
import { LabaRugiDocument, NeracaDocument } from "@/components/finance-reports";
import { computeFinance } from "@/lib/finance";
import { pdfFilename } from "@/lib/pdf";
import { renderDocumentPdf } from "@/lib/print-pdf";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  await requireSession();
  const { kind, id } = await params;
  const db = await readDb();

  if (kind === "invoice" || kind === "faktur") {
    const invoice = db.invoices.find((row) => row.id === id);
    const customer = invoice && db.customers.find((row) => row.id === invoice.customerId);
    if (!invoice || !customer) return missing();
    const bank = resolveBank(db, invoice.bankId);
    const bytes = await renderDocumentPdf(
      createElement(kind === "invoice" ? InvoiceDocument : FakturDocument, {
        profile: db.profile,
        customer,
        invoice,
        bank,
      }),
    );
    const number = kind === "invoice" ? invoice.number : invoice.fakturNumber || invoice.number;
    return pdfResponse(bytes, pdfFilename(number, kind));
  }

  if (kind === "ba") {
    const ba = db.beritaAcaras.find((row) => row.id === id);
    const customer = ba && db.customers.find((row) => row.id === ba.customerId);
    if (!ba || !customer) return missing();
    return pdfResponse(
      await renderDocumentPdf(createElement(BeritaAcaraDocument, { profile: db.profile, customer, ba })),
      pdfFilename(ba.number, "ba"),
    );
  }

  if (kind === "sj") {
    const sj = db.suratJalans.find((row) => row.id === id);
    const customer = sj && db.customers.find((row) => row.id === sj.customerId);
    if (!sj || !customer) return missing();
    return pdfResponse(
      await renderDocumentPdf(createElement(SuratJalanDocument, { profile: db.profile, customer, sj })),
      pdfFilename(sj.number, "sj"),
    );
  }

  if (kind === "penawaran") {
    const quotation = db.quotations.find((row) => row.id === id);
    const customer = quotation && db.customers.find((row) => row.id === quotation.customerId);
    if (!quotation || !customer) return missing();
    const source = quotation.sourceId
      ? db.quotations.find((row) => row.id === quotation.sourceId)
      : null;
    return pdfResponse(
      await renderDocumentPdf(
        createElement(QuotationDocument, {
          profile: db.profile,
          customer,
          quotation,
          sourceNumber: source?.number,
        }),
      ),
      pdfFilename(quotation.number, quotation.kind),
    );
  }

  if (kind === "gaji") {
    const payroll = db.payrolls.find((row) => row.id === id);
    if (!payroll) return missing();
    const order = payroll.orderId ? db.orders.find((row) => row.id === payroll.orderId) : null;
    return pdfResponse(
      await renderDocumentPdf(
        createElement(PayrollDocument, {
          profile: db.profile,
          payroll,
          orderNumber: order?.number,
        }),
      ),
      pdfFilename(payroll.number, "gaji"),
    );
  }

  if (kind === "laba-rugi" || kind === "neraca") {
    if (!/^\d{4}-\d{2}$/.test(id)) return missing();
    const finance = computeFinance(db, id);
    return pdfResponse(
      await renderDocumentPdf(
        createElement(kind === "laba-rugi" ? LabaRugiDocument : NeracaDocument, {
          profile: db.profile,
          finance,
        }),
      ),
      pdfFilename(id, kind),
    );
  }

  return missing();
}

function missing() {
  return new Response("Dokumen tidak ditemukan", { status: 404 });
}

function pdfResponse(bytes: Uint8Array, filename: string) {
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
