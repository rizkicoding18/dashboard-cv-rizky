import { monthKey } from "@/lib/format";
import { isPostedPayroll, payrollKindTotal, payrollTotal } from "@/lib/payroll";
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
  bebanOperasional: number;
  bebanUpah: number;
  bebanProduksiLuar: number;
  labaBersih: number;
  kas: number;
  piutang: number;
  persediaan: number;
  hutang: number;
  hutangGaji: number;
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
  const payrolls = db.payrolls ?? [];
  const postedPayrolls = payrolls.filter((row) => isPostedPayroll(row.status));
  const periodPayrolls = postedPayrolls.filter((row) => inPeriod(row.date, period));
  const bebanUpah = periodPayrolls.reduce((sum, row) => sum + payrollKindTotal(row, "pekerja"), 0);
  const bebanProduksiLuar = periodPayrolls.reduce((sum, row) => sum + payrollKindTotal(row, "vendor"), 0);
  const bebanOperasional = db.expenses
    .filter((expense) => inPeriod(expense.date, period))
    .reduce((sum, expense) => sum + expense.amount, 0);
  const beban = bebanOperasional + bebanUpah + bebanProduksiLuar;
  const labaKotor = pendapatan - hpp;
  const labaBersih = labaKotor - beban;

  const ytdIssued = issued.filter((invoice) => {
    if (!period || period === "all") return true;
    return invoice.date.slice(0, 4) === period.slice(0, 4);
  });
  const ytdPendapatan = ytdIssued.reduce((sum, invoice) => sum + invoiceDpp(invoice), 0);
  const ytdHpp = ytdIssued.reduce((sum, invoice) => sum + invoiceCogs(invoice.items), 0);
  const ytdBebanOperasional = db.expenses
    .filter((expense) => {
      if (!period || period === "all") return true;
      return expense.date.slice(0, 4) === period.slice(0, 4);
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
  const ytdPayrolls = postedPayrolls.filter((row) => {
    if (!period || period === "all") return true;
    return row.date.slice(0, 4) === period.slice(0, 4);
  });
  const ytdBebanPayroll = ytdPayrolls.reduce((sum, row) => sum + payrollTotal(row), 0);
  const labaTahun = ytdPendapatan - ytdHpp - ytdBebanOperasional - ytdBebanPayroll;

  const payments = db.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidPurchases = db.purchases
    .filter((purchase) => purchase.paid)
    .reduce((sum, purchase) => sum + purchaseTotal(purchase.items), 0);
  const unpaidPurchases = db.purchases
    .filter((purchase) => !purchase.paid)
    .reduce((sum, purchase) => sum + purchaseTotal(purchase.items), 0);
  const allExpenses = db.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidPayrolls = payrolls
    .filter((row) => row.status === "lunas")
    .reduce((sum, row) => sum + payrollTotal(row), 0);
  const unpaidPayrolls = payrolls
    .filter((row) => row.status === "terbit")
    .reduce((sum, row) => sum + payrollTotal(row), 0);

  const kas = db.profile.openingCash + payments - paidPurchases - allExpenses - paidPayrolls;
  const piutang = issued.reduce((sum, invoice) => sum + invoiceOutstanding(invoice), 0);
  const persediaan = db.products.reduce(
    (sum, product) => sum + Math.max(0, product.stock) * product.costPrice,
    0,
  );
  const ppnKeluaran = issued.reduce((sum, invoice) => sum + invoicePpn(invoice), 0);

  const aktiva = kas + piutang + persediaan;
  const hutang = unpaidPurchases + unpaidPayrolls;
  const kewajiban = hutang + ppnKeluaran;
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
    bebanOperasional,
    bebanUpah,
    bebanProduksiLuar,
    labaBersih,
    kas,
    piutang,
    persediaan,
    hutang,
    hutangGaji: unpaidPayrolls,
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
          .reduce((sum, expense) => sum + expense.amount, 0) -
        postedPayrolls
          .filter((row) => monthKey(row.date) === currentMonth)
          .reduce((sum, row) => sum + payrollTotal(row), 0)
      : labaBersih,
    labaTahun,
  };
}
