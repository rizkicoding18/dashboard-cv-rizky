import type { PayeeKind, Payroll, PayrollItem, PayrollStatus, WorkType } from "@/lib/types";

export const PAYEE_KIND_LABEL: Record<PayeeKind, string> = {
  pekerja: "Pekerja",
  vendor: "Vendor / perusahaan luar",
};

export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  desain: "Desain",
  cetak: "Cetak",
  finishing: "Finishing",
  packing: "Packing",
  lainnya: "Lainnya",
};

export const PAYROLL_STATUS_LABEL: Record<PayrollStatus, string> = {
  draft: "Draft",
  terbit: "Belum dibayar",
  lunas: "Lunas",
};

export const PAYROLL_UNITS = ["pekerjaan", "nota", "jam", "lembar", "m2", "pcs", "paket", "set"];

export function payrollItemAmount(item: Pick<PayrollItem, "qty" | "rate">) {
  return Math.round((Number(item.qty) || 0) * (Number(item.rate) || 0));
}

export function payrollTotal(payroll: Pick<Payroll, "items">) {
  return payroll.items.reduce((sum, item) => sum + payrollItemAmount(item), 0);
}

export function payrollKindTotal(payroll: Pick<Payroll, "items">, kind: PayeeKind) {
  return payroll.items
    .filter((item) => item.kind === kind)
    .reduce((sum, item) => sum + payrollItemAmount(item), 0);
}

export function isPostedPayroll(status: PayrollStatus) {
  return status === "terbit" || status === "lunas";
}
