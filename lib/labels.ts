import type {
  ExpenseCategory,
  InvoiceStatus,
  OrderStatus,
  ProductCategory,
} from "@/lib/types";

export const CATEGORY_LABEL: Record<ProductCategory, string> = {
  percetakan: "Percetakan",
  pengadaan: "Pengadaan",
  atk: "ATK",
  jasa: "Jasa",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  baru: "Baru",
  proses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  terbit: "Terbit",
  sebagian: "Sebagian",
  lunas: "Lunas",
  batal: "Batal",
};

export const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  operasional: "Operasional",
  gaji: "Gaji",
  sewa: "Sewa",
  utilitas: "Listrik & utilitas",
  bahan: "Bahan baku",
  lainnya: "Lainnya",
};

export const UNIT_OPTIONS = [
  "pcs",
  "box",
  "rim",
  "lembar",
  "m2",
  "roll",
  "eksemplar",
  "paket",
  "set",
];
