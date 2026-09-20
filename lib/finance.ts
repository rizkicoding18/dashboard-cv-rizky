import { monthKey } from "@/lib/format";
import { lineAmount } from "@/lib/pricing";
import type { Database, Invoice, LineItem } from "@/lib/types";

export function invoiceSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + lineAmount(item.qty, item.unitPrice), 0);
}

export function invoiceCogs(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + lineAmount(item.qty, item.costPrice), 0);
}

export function invoiceDpp(invoice: Pick<Invoice, "items" | "discount">): number {
  return Math.max(0, invoiceSubtotal(invoice.items) - (invoice.discount || 0));
}

export function invoicePpn(
  invoice: Pick<Invoice, "items" | "discount" | "includePpn" | "ppnRate">,
): number {
  if (!invoice.includePpn) return 0;
  return Math.round(invoiceDpp(invoice) * invoice.ppnRate);
}

export function invoiceTotal(invoice: Invoice): number {
  return invoiceDpp(invoice) + invoicePpn(invoice);
}

export function invoiceOutstanding(invoice: Invoice): number {
  if (invoice.status === "draft" || invoice.status === "batal") return 0;
  return Math.max(0, invoiceTotal(invoice) - (invoice.paidAmount || 0));
}

export function isIssued(status: Invoice["status"]): boolean {
  return status === "terbit" || status === "sebagian" || status === "lunas";
}

export function purchaseTotal(items: { qty: number; unitCost: number }[]): number {
  return items.reduce((sum, item) => sum + lineAmount(item.qty, item.unitCost), 0);
}

export function deriveInvoiceStatus(invoice: Invoice): Invoice["status"] {
  if (invoice.status === "draft" || invoice.status === "batal") return invoice.status;
  const total = invoiceTotal(invoice);
  if (invoice.paidAmount >= total && total > 0) return "lunas";
  if (invoice.paidAmount > 0) return "sebagian";
  return "terbit";
}

export interface FinanceSummary {
  period: string | "all";
  pendapatan: number;
  hpp: number;
  labaKotor: number;
  beban: number;
  labaBersih: number;
  kas: number;
  piutang: number;
  persediaan: number;
  hutang: number;
  ppnKeluaran: number;
  aktiva: number;
  kewajiban: number;
  modal: number;
  penyesuaian: number;
  ekuitas: number;
  omzetBulanIni: number;
  labaBulanIni: number;
  labaTahun: number;
}

function inPeriod(date: string, period?: string) {
  if (!period || period === "all") return true;
  return monthKey(date) === period;
}

export function computeFinance(db: Database, period?: string): FinanceSummary {
  const issued = db.invoices.filter((invoice) => isIssued(invoice.status));
  const periodIssued = issued.filter((invoice) => inPeriod(invoice.date, period));

  const pendapatan = periodIssued.reduce((sum, invoice) => sum + invoiceDpp(invoice), 0);
  const hpp = periodIssued.reduce((sum, invoice) => sum + invoiceCogs(invoice.items), 0);
  const beban = db.expenses
    .filter((expense) => inPeriod(expense.date, period))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const labaKotor = pendapatan - hpp;
  const labaBersih = labaKotor - beban;

  const ytdIssued = issued.filter((invoice) => {
    if (!period || period === "all") return true;
    return invoice.date.slice(0, 4) === period.slice(0, 4);
  });
  const ytdPendapatan = ytdIssued.reduce((sum, invoice) => sum + invoiceDpp(invoice), 0);
  const ytdHpp = ytdIssued.reduce((sum, invoice) => sum + invoiceCogs(invoice.items), 0);
  const ytdBeban = db.expenses
    .filter((expense) => {
      if (!period || period === "all") return true;
      return expense.date.slice(0, 4) === period.slice(0, 4);
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
  const labaTahun = ytdPendapatan - ytdHpp - ytdBeban;

  const payments = db.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidPurchases = db.purchases
    .filter((purchase) => purchase.paid)
    .reduce((sum, purchase) => sum + purchaseTotal(purchase.items), 0);
  const unpaidPurchases = db.purchases
    .filter((purchase) => !purchase.paid)
    .reduce((sum, purchase) => sum + purchaseTotal(purchase.items), 0);
  const allExpenses = db.expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const kas = db.profile.openingCash + payments - paidPurchases - allExpenses;
  const piutang = issued.reduce((sum, invoice) => sum + invoiceOutstanding(invoice), 0);
  const persediaan = db.products.reduce(
    (sum, product) => sum + Math.max(0, product.stock) * product.costPrice,
    0,
  );
  const ppnKeluaran = issued.reduce((sum, invoice) => sum + invoicePpn(invoice), 0);

  const aktiva = kas + piutang + persediaan;
  const kewajiban = unpaidPurchases + ppnKeluaran;
  const modal = db.profile.openingCapital;
  const ekuitas = aktiva - kewajiban;
  const penyesuaian = ekuitas - modal - labaTahun;

  const currentMonth = period && period !== "all" ? period : undefined;
  const monthIssued = currentMonth
    ? issued.filter((invoice) => monthKey(invoice.date) === currentMonth)
    : periodIssued;

  return {
    period: period || "all",
    pendapatan,
    hpp,
    labaKotor,
    beban,
    labaBersih,
    kas,
    piutang,
    persediaan,
    hutang: unpaidPurchases,
    ppnKeluaran,
    aktiva,
    kewajiban,
    modal,
    penyesuaian,
    ekuitas,
    omzetBulanIni: monthIssued.reduce((sum, invoice) => sum + invoiceDpp(invoice), 0),
    labaBulanIni: currentMonth
      ? monthIssued.reduce((sum, invoice) => sum + invoiceDpp(invoice) - invoiceCogs(invoice.items), 0) -
        db.expenses
          .filter((expense) => monthKey(expense.date) === currentMonth)
          .reduce((sum, expense) => sum + expense.amount, 0)
      : labaBersih,
    labaTahun,
  };
}
