"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deriveInvoiceStatus,
  invoiceTotal,
  isIssued,
  purchaseTotal,
} from "@/lib/finance";
import { assignFakturNumber, ensureInvoiceCompanions } from "@/lib/docs";
import { createId, nextNumber } from "@/lib/ids";
import { createSeed } from "@/lib/seed";
import { readDb, replaceDb, updateDb } from "@/lib/store";
import { setDefaultBank, syncProfileBank } from "@/lib/banks";
import { todayIso } from "@/lib/format";
import type {
  BankAccount,
  BaItem,
  CompanyProfile,
  Customer,
  DraftBaLine,
  DraftLine,
  DraftSjLine,
  Expense,
  ExpenseCategory,
  Invoice,
  LineItem,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductCategory,
  Quotation,
  QuotationKind,
  SuratJalanItem,
} from "@/lib/types";
import { buildSphFromOrder, QUOTATION_NUMBER_PREFIX } from "@/lib/quotations";

function refresh() {
  revalidatePath("/", "layout");
}

function toLines(drafts: DraftLine[]): LineItem[] {
  return drafts
    .filter((row) => row.name.trim() && row.qty > 0)
    .map((row) => ({
      id: createId("li"),
      productId: row.productId || null,
      name: row.name.trim(),
      spec: row.spec.trim(),
      qty: Number(row.qty) || 0,
      unit: row.unit || "pcs",
      unitPrice: Number(row.unitPrice) || 0,
      costPrice: Number(row.costPrice) || 0,
    }));
}

function toSjItems(drafts: DraftSjLine[]): SuratJalanItem[] {
  return drafts
    .filter((row) => row.name.trim() && row.qty > 0)
    .map((row) => ({
      id: createId("sj_i"),
      name: row.name.trim(),
      spec: row.spec.trim(),
      qty: Number(row.qty) || 0,
      unit: row.unit || "pcs",
      notes: row.notes.trim(),
    }));
}

function toBaItems(drafts: DraftBaLine[]): BaItem[] {
  return drafts
    .filter((row) => row.name.trim() && row.qty > 0)
    .map((row) => ({
      id: createId("ba_i"),
      name: row.name.trim(),
      spec: row.spec.trim(),
      qty: Number(row.qty) || 0,
      unit: row.unit || "pcs",
      condition: row.condition.trim() || "Baik",
    }));
}

function applyStockOut(invoice: Invoice) {
  return updateDb((db) => {
    for (const item of invoice.items) {
      if (!item.productId) continue;
      const product = db.products.find((row) => row.id === item.productId);
      if (!product?.trackStock) continue;
      product.stock -= item.qty;
      db.stockMoves.push({
        id: createId("sm"),
        productId: product.id,
        type: "keluar",
        qty: item.qty,
        unitCost: item.costPrice,
        refType: "invoice",
        refId: invoice.id,
        notes: `Penjualan ${invoice.number}`,
        date: invoice.date,
      });
    }
  });
}

export async function createCustomer(input: {
  name: string;
  pic: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}) {
  if (!input.name.trim()) return { error: "Nama perusahaan wajib diisi." };
  const customer = await updateDb((db) => {
    const row: Customer = {
      id: createId("cus"),
      name: input.name.trim(),
      pic: input.pic.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      address: input.address.trim(),
      npwp: "",
      notes: input.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    db.customers.unshift(row);
    return row;
  });
  refresh();
  redirect(`/pelanggan/${customer.id}`);
}

export async function updateCustomer(
  id: string,
  input: {
    name: string;
    pic: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  },
) {
  if (!input.name.trim()) return { error: "Nama perusahaan wajib diisi." };
  await updateDb((db) => {
    const row = db.customers.find((item) => item.id === id);
    if (!row) throw new Error("Pelanggan tidak ditemukan");
    Object.assign(row, {
      name: input.name.trim(),
      pic: input.pic.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      address: input.address.trim(),
      notes: input.notes.trim(),
    });
  });
  refresh();
}

export async function deleteCustomer(id: string) {
  await updateDb((db) => {
    const used =
      db.orders.some((row) => row.customerId === id) ||
      db.invoices.some((row) => row.customerId === id) ||
      db.suratJalans.some((row) => row.customerId === id);
    if (used) {
      throw new Error("Pelanggan tidak bisa dihapus karena sudah punya transaksi.");
    }
    db.customers = db.customers.filter((row) => row.id !== id);
    db.customerPrices = db.customerPrices.filter((row) => row.customerId !== id);
  });
  refresh();
  redirect("/pelanggan");
}

export async function createProduct(input: {
  sku: string;
  name: string;
  category: ProductCategory;
  unit: string;
  stock: number;
  minStock: number;
  costPrice: number;
  defaultPrice: number;
  trackStock: boolean;
  description: string;
}) {
  if (!input.name.trim()) return { error: "Nama barang wajib diisi." };
  const product = await updateDb((db) => {
    const row: Product = {
      id: createId("prd"),
      sku: input.sku.trim() || nextNumber("SKU", db.products.map((item) => item.sku)),
      name: input.name.trim(),
      category: input.category,
      unit: input.unit || "pcs",
      stock: Number(input.stock) || 0,
      minStock: Number(input.minStock) || 0,
      costPrice: Number(input.costPrice) || 0,
      defaultPrice: Number(input.defaultPrice) || 0,
      trackStock: Boolean(input.trackStock),
      description: input.description.trim(),
      createdAt: new Date().toISOString(),
    };
    db.products.unshift(row);
    return row;
  });
  refresh();
  redirect(`/barang/${product.id}`);
}

export async function updateProduct(
  id: string,
  input: {
    sku: string;
    name: string;
    category: ProductCategory;
    unit: string;
    minStock: number;
    costPrice: number;
    defaultPrice: number;
    trackStock: boolean;
    description: string;
  },
) {
  if (!input.name.trim()) return { error: "Nama barang wajib diisi." };
  await updateDb((db) => {
    const row = db.products.find((item) => item.id === id);
    if (!row) throw new Error("Barang tidak ditemukan");
    Object.assign(row, {
      sku: input.sku.trim(),
      name: input.name.trim(),
      category: input.category,
      unit: input.unit || row.unit,
      minStock: Number(input.minStock) || 0,
      costPrice: Number(input.costPrice) || 0,
      defaultPrice: Number(input.defaultPrice) || 0,
      trackStock: Boolean(input.trackStock),
      description: input.description.trim(),
    });
  });
  refresh();
}

export async function upsertCustomerPrice(input: {
  customerId: string;
  productId: string;
  unitPrice: number;
  notes: string;
}) {
  if (!input.customerId || !input.productId) {
    return { error: "Pilih perusahaan dan isi harga." };
  }
  await updateDb((db) => {
    const existing = db.customerPrices.find(
      (row) => row.customerId === input.customerId && row.productId === input.productId,
    );
    if (existing) {
      existing.unitPrice = Number(input.unitPrice) || 0;
      existing.notes = input.notes.trim();
      return;
    }
    db.customerPrices.push({
      id: createId("price"),
      customerId: input.customerId,
      productId: input.productId,
      unitPrice: Number(input.unitPrice) || 0,
      notes: input.notes.trim(),
    });
  });
  refresh();
}

export async function deleteCustomerPrice(id: string) {
  await updateDb((db) => {
    db.customerPrices = db.customerPrices.filter((row) => row.id !== id);
  });
  refresh();
}

export async function createOrder(input: {
  customerId: string;
  date: string;
  dueDate: string;
  notes: string;
  items: DraftLine[];
}) {
  if (!input.customerId) return { error: "Pilih perusahaan pemesan." };
  const items = toLines(input.items);
  if (!items.length) return { error: "Tambahkan minimal satu item." };
  const order = await updateDb((db) => {
    const row = {
      id: createId("ord"),
      number: nextNumber(
        "ORD",
        db.orders.map((item) => item.number),
      ),
      customerId: input.customerId,
      date: input.date || todayIso(),
      dueDate: input.dueDate || "",
      status: "baru" as const,
      notes: input.notes.trim(),
      items,
      createdAt: new Date().toISOString(),
    };
    db.orders.unshift(row);
    db.quotations.unshift(buildSphFromOrder(db, row));
    return row;
  });
  refresh();
  redirect(`/order/${order.id}`);
}

export async function updateOrder(
  id: string,
  input: {
    customerId: string;
    date: string;
    dueDate: string;
    notes: string;
    items: DraftLine[];
  },
) {
  const items = toLines(input.items);
  if (!items.length) return { error: "Tambahkan minimal satu item." };
  await updateDb((db) => {
    const row = db.orders.find((item) => item.id === id);
    if (!row) throw new Error("Order tidak ditemukan");
    if (row.status === "dibatalkan") throw new Error("Order batal tidak bisa diubah.");
    row.customerId = input.customerId;
    row.date = input.date;
    row.dueDate = input.dueDate;
    row.notes = input.notes.trim();
    row.items = items;
  });
  refresh();
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await updateDb((db) => {
    const row = db.orders.find((item) => item.id === id);
    if (!row) throw new Error("Order tidak ditemukan");
    row.status = status;
  });
  refresh();
}

export async function deleteOrder(id: string) {
  await updateDb((db) => {
    const linked =
      db.invoices.some((row) => row.orderId === id) ||
      db.suratJalans.some((row) => row.orderId === id) ||
      db.beritaAcaras.some((row) => row.orderId === id);
    if (linked) throw new Error("Order sudah punya invoice atau dokumen kirim, tidak bisa dihapus.");
    db.quotations = db.quotations.filter((row) => row.orderId !== id);
    db.orders = db.orders.filter((row) => row.id !== id);
  });
  refresh();
  redirect("/order");
}

export async function createInvoice(input: {
  customerId: string;
  orderId: string | null;
  date: string;
  dueDate: string;
  notes: string;
  discount: number;
  includePpn: boolean;
  ppnRate: number;
  bankId: string | null;
  items: DraftLine[];
  issue: boolean;
}) {
  if (!input.customerId) return { error: "Pilih perusahaan." };
  const items = toLines(input.items);
  if (!items.length) return { error: "Tambahkan minimal satu item." };
  const invoice = await updateDb((db) => {
    const row: Invoice = {
      id: createId("inv"),
      number: nextNumber(
        "INV",
        db.invoices.map((item) => item.number),
      ),
      fakturNumber: nextNumber(
        "FKT",
        db.invoices.map((item) => item.fakturNumber).filter(Boolean),
      ),
      orderId: input.orderId,
      customerId: input.customerId,
      date: input.date || todayIso(),
      dueDate: input.dueDate || "",
      status: "draft",
      items,
      discount: Number(input.discount) || 0,
      includePpn: Boolean(input.includePpn),
      ppnRate: Number(input.ppnRate) || 0,
      notes: input.notes.trim(),
      bankId: input.bankId || db.banks.find((bank) => bank.isDefault)?.id || db.banks[0]?.id || null,
      paidAmount: 0,
      issuedAt: null,
      createdAt: new Date().toISOString(),
    };
    db.invoices.unshift(row);
    return row;
  });
  if (input.issue) {
    await issueInvoice(invoice.id);
    return;
  }
  refresh();
  redirect(`/dokumen/invoice/${invoice.id}`);
}

export async function updateInvoice(
  id: string,
  input: {
    customerId: string;
    date: string;
    dueDate: string;
    notes: string;
    discount: number;
    includePpn: boolean;
    ppnRate: number;
    bankId: string | null;
    items: DraftLine[];
  },
) {
  const items = toLines(input.items);
  if (!items.length) return { error: "Tambahkan minimal satu item." };
  await updateDb((db) => {
    const row = db.invoices.find((item) => item.id === id);
    if (!row) throw new Error("Faktur tidak ditemukan");
    if (row.status !== "draft") throw new Error("Faktur terbit tidak bisa diubah.");
    row.customerId = input.customerId;
    row.date = input.date;
    row.dueDate = input.dueDate;
    row.notes = input.notes.trim();
    row.discount = Number(input.discount) || 0;
    row.includePpn = Boolean(input.includePpn);
    row.ppnRate = Number(input.ppnRate) || 0;
    row.bankId = input.bankId;
    row.items = items;
  });
  refresh();
}

export async function issueInvoice(id: string) {
  const invoice = await updateDb((db) => {
    const row = db.invoices.find((item) => item.id === id);
    if (!row) throw new Error("Faktur tidak ditemukan");
    if (row.status !== "draft") throw new Error("Faktur sudah terbit.");
    row.status = "terbit";
    row.issuedAt = new Date().toISOString();
    assignFakturNumber(db, row);
    ensureInvoiceCompanions(db, row);
    return row;
  });
  await applyStockOut(invoice);
  refresh();
  redirect(`/dokumen/invoice/${id}`);
}

export async function deleteInvoice(id: string) {
  await updateDb((db) => {
    const row = db.invoices.find((item) => item.id === id);
    if (!row) return;
    if (isIssued(row.status)) {
      throw new Error("Faktur yang sudah terbit tidak bisa dihapus.");
    }
    db.invoices = db.invoices.filter((item) => item.id !== id);
  });
  refresh();
  redirect("/dokumen");
}

export async function addPayment(input: {
  invoiceId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  notes: string;
}) {
  const amount = Number(input.amount) || 0;
  if (amount <= 0) return { error: "Nominal pembayaran harus lebih dari 0." };
  const snapshot = await readDb();
  const current = snapshot.invoices.find((row) => row.id === input.invoiceId);
  if (!current) throw new Error("Faktur tidak ditemukan");
  if (!isIssued(current.status)) throw new Error("Faktur belum terbit.");
  const outstanding = invoiceTotal(current) - current.paidAmount;
  if (amount > outstanding) return { error: "Nominal melebihi sisa tagihan." };

  await updateDb((db) => {
    const invoice = db.invoices.find((row) => row.id === input.invoiceId);
    if (!invoice) throw new Error("Faktur tidak ditemukan");
    db.payments.push({
      id: createId("pay"),
      invoiceId: invoice.id,
      date: input.date || todayIso(),
      amount,
      method: input.method,
      notes: input.notes.trim(),
    });
    invoice.paidAmount += amount;
    invoice.status = deriveInvoiceStatus(invoice);
  });
  refresh();
}

export async function createBeritaAcara(input: {
  customerId: string;
  invoiceId: string | null;
  orderId: string | null;
  date: string;
  location: string;
  title: string;
  description: string;
  notes: string;
  items: DraftBaLine[];
}) {
  if (!input.customerId) return { error: "Pilih perusahaan." };
  const items = toBaItems(input.items);
  if (!items.length) return { error: "Tambahkan daftar barang atau pekerjaan." };
  const ba = await updateDb((db) => {
    const row = {
      id: createId("ba"),
      number: nextNumber(
        "BA",
        db.beritaAcaras.map((item) => item.number),
      ),
      invoiceId: input.invoiceId,
      orderId: input.orderId,
      customerId: input.customerId,
      date: input.date || todayIso(),
      location: input.location.trim(),
      title: input.title.trim() || "Berita Acara Serah Terima",
      description: input.description.trim(),
      items,
      notes: input.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    db.beritaAcaras.unshift(row);
    return row;
  });
  refresh();
  redirect(`/dokumen/ba/${ba.id}`);
}

export async function deleteBeritaAcara(id: string) {
  await updateDb((db) => {
    db.beritaAcaras = db.beritaAcaras.filter((row) => row.id !== id);
  });
  refresh();
  redirect("/dokumen");
}

export async function createSuratJalan(input: {
  customerId: string;
  invoiceId: string | null;
  orderId: string | null;
  date: string;
  destination: string;
  vehicle: string;
  driver: string;
  notes: string;
  items: DraftSjLine[];
}) {
  if (!input.invoiceId) return { error: "Surat jalan dibuat dari invoice." };
  const items = toSjItems(input.items);
  if (!items.length) return { error: "Tambahkan minimal satu barang." };
  const sj = await updateDb((db) => {
    const invoice = db.invoices.find((row) => row.id === input.invoiceId);
    if (!invoice) throw new Error("Invoice tidak ditemukan");
    if (!isIssued(invoice.status)) throw new Error("Invoice belum terbit.");
    const row = {
      id: createId("sj"),
      number: nextNumber(
        "SJ",
        db.suratJalans.map((item) => item.number),
      ),
      invoiceId: invoice.id,
      orderId: input.orderId || invoice.orderId,
      customerId: invoice.customerId,
      date: input.date || todayIso(),
      destination: input.destination.trim(),
      vehicle: input.vehicle.trim(),
      driver: input.driver.trim(),
      items,
      notes: input.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    db.suratJalans.unshift(row);
    return row;
  });
  refresh();
  redirect(`/dokumen/invoice/${sj.invoiceId}`);
}

export async function deleteSuratJalan(id: string) {
  const invoiceId = await updateDb((db) => {
    const row = db.suratJalans.find((item) => item.id === id);
    const parentId = row?.invoiceId || null;
    db.suratJalans = db.suratJalans.filter((item) => item.id !== id);
    return parentId;
  });
  refresh();
  redirect(invoiceId ? `/dokumen/invoice/${invoiceId}` : "/dokumen");
}

export async function createPurchase(input: {
  date: string;
  supplier: string;
  paid: boolean;
  notes: string;
  productId: string;
  qty: number;
  unitCost: number;
}) {
  if (!input.productId) return { error: "Pilih barang." };
  const qty = Number(input.qty) || 0;
  const unitCost = Number(input.unitCost) || 0;
  if (qty <= 0) return { error: "Jumlah stok masuk harus lebih dari 0." };
  await updateDb((db) => {
    const product = db.products.find((row) => row.id === input.productId);
    if (!product) throw new Error("Barang tidak ditemukan");
    const purchase = {
      id: createId("pur"),
      number: nextNumber(
        "PBL",
        db.purchases.map((item) => item.number),
      ),
      date: input.date || todayIso(),
      supplier: input.supplier.trim() || "Supplier",
      items: [
        {
          productId: product.id,
          name: product.name,
          qty,
          unit: product.unit,
          unitCost,
        },
      ],
      paid: Boolean(input.paid),
      notes: input.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    db.purchases.unshift(purchase);
    if (product.trackStock) {
      const oldQty = Math.max(product.stock, 0);
      const newQty = oldQty + qty;
      product.costPrice =
        newQty > 0 ? Math.round((oldQty * product.costPrice + qty * unitCost) / newQty) : unitCost;
      product.stock += qty;
      db.stockMoves.push({
        id: createId("sm"),
        productId: product.id,
        type: "masuk",
        qty,
        unitCost,
        refType: "pembelian",
        refId: purchase.id,
        notes: `Pembelian ${purchase.number}`,
        date: purchase.date,
      });
    }
    return purchaseTotal(purchase.items);
  });
  refresh();
}

export async function createExpense(input: {
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
}) {
  const amount = Number(input.amount) || 0;
  if (!input.description.trim()) return { error: "Uraian beban wajib diisi." };
  if (amount <= 0) return { error: "Nominal beban harus lebih dari 0." };
  await updateDb((db) => {
    const row: Expense = {
      id: createId("exp"),
      date: input.date || todayIso(),
      category: input.category,
      description: input.description.trim(),
      amount,
    };
    db.expenses.unshift(row);
    return row;
  });
  refresh();
}

export async function deleteExpense(id: string) {
  await updateDb((db) => {
    db.expenses = db.expenses.filter((row) => row.id !== id);
  });
  refresh();
}

export async function updateProfile(input: Omit<CompanyProfile, "bankName" | "bankAccount" | "bankHolder">) {
  if (!input.name.trim()) return { error: "Nama usaha wajib diisi." };
  await updateDb((db) => {
    db.profile = {
      ...db.profile,
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      owner: input.owner.trim(),
      ownerTitle: input.ownerTitle.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      phone: input.phone.trim(),
      email: input.email.trim(),
      npwp: input.npwp.trim(),
      defaultPpnRate: Number(input.defaultPpnRate) || 0,
      openingCash: Number(input.openingCash) || 0,
      openingCapital: Number(input.openingCapital) || 0,
    };
    syncProfileBank(db);
  });
  refresh();
}

export async function createBank(input: {
  bankName: string;
  accountNumber: string;
  holder: string;
  isDefault: boolean;
  notes: string;
}) {
  if (!input.bankName.trim()) return { error: "Nama bank wajib diisi." };
  if (!input.accountNumber.trim()) return { error: "Nomor rekening wajib diisi." };
  const bank = await updateDb((db) => {
    const row: BankAccount = {
      id: createId("bnk"),
      bankName: input.bankName.trim(),
      accountNumber: input.accountNumber.trim(),
      holder: input.holder.trim() || db.profile.name,
      isDefault: Boolean(input.isDefault) || db.banks.length === 0,
      notes: input.notes.trim(),
    };
    if (row.isDefault) {
      for (const item of db.banks) item.isDefault = false;
    }
    db.banks.unshift(row);
    syncProfileBank(db);
    return row;
  });
  refresh();
  redirect(`/bank/${bank.id}`);
}

export async function updateBank(
  id: string,
  input: {
    bankName: string;
    accountNumber: string;
    holder: string;
    isDefault: boolean;
    notes: string;
  },
) {
  if (!input.bankName.trim()) return { error: "Nama bank wajib diisi." };
  if (!input.accountNumber.trim()) return { error: "Nomor rekening wajib diisi." };
  await updateDb((db) => {
    const row = db.banks.find((item) => item.id === id);
    if (!row) throw new Error("Rekening tidak ditemukan");
    row.bankName = input.bankName.trim();
    row.accountNumber = input.accountNumber.trim();
    row.holder = input.holder.trim() || db.profile.name;
    row.notes = input.notes.trim();
    if (input.isDefault || db.banks.length === 1) setDefaultBank(db, id);
    else syncProfileBank(db);
  });
  refresh();
}

export async function deleteBank(id: string) {
  await updateDb((db) => {
    if (db.banks.length <= 1) {
      throw new Error("Minimal satu rekening bank harus tersimpan.");
    }
    db.banks = db.banks.filter((item) => item.id !== id);
    if (!db.banks.some((item) => item.isDefault) && db.banks[0]) {
      db.banks[0].isDefault = true;
    }
    for (const invoice of db.invoices) {
      if (invoice.bankId === id) invoice.bankId = db.banks.find((item) => item.isDefault)?.id || db.banks[0]?.id || null;
    }
    for (const quotation of db.quotations) {
      if (quotation.bankId === id) quotation.bankId = db.banks.find((item) => item.isDefault)?.id || db.banks[0]?.id || null;
    }
    syncProfileBank(db);
  });
  refresh();
  redirect("/bank");
}

export async function createQuotation(input: {
  kind: QuotationKind;
  orderId: string;
  customerId: string;
  sourceId: string | null;
  date: string;
  validUntil: string;
  subject: string;
  intro: string;
  terms: string;
  notes: string;
  discount: number;
  includePpn: boolean;
  ppnRate: number;
  bankId: string | null;
  items: DraftLine[];
}) {
  if (!input.orderId) return { error: "Penawaran dibuat dari order." };
  const items = toLines(input.items);
  if (!items.length) return { error: "Tambahkan minimal satu item." };
  const quotation = await updateDb((db) => {
    const order = db.orders.find((row) => row.id === input.orderId);
    if (!order) throw new Error("Order tidak ditemukan");
    if (order.status === "dibatalkan") throw new Error("Order batal tidak bisa dibuatkan penawaran.");
    const kind = input.kind === "negosiasi" ? "negosiasi" : "sph";
    const row: Quotation = {
      id: createId("qtn"),
      number: nextNumber(
        QUOTATION_NUMBER_PREFIX[kind],
        db.quotations.filter((item) => item.kind === kind).map((item) => item.number),
      ),
      kind,
      orderId: order.id,
      customerId: order.customerId,
      sourceId: kind === "negosiasi" ? input.sourceId : null,
      date: input.date || todayIso(),
      validUntil: input.validUntil || "",
      subject: input.subject.trim(),
      intro: input.intro.trim(),
      terms: input.terms.trim(),
      notes: input.notes.trim(),
      items,
      discount: Number(input.discount) || 0,
      includePpn: Boolean(input.includePpn),
      ppnRate: Number(input.ppnRate) || 0,
      bankId: input.bankId || db.banks.find((bank) => bank.isDefault)?.id || db.banks[0]?.id || null,
      createdAt: new Date().toISOString(),
    };
    db.quotations.unshift(row);
    return row;
  });
  refresh();
  redirect(`/order/${quotation.orderId}`);
}

export async function updateQuotation(
  id: string,
  input: {
    kind: QuotationKind;
    orderId: string;
    customerId: string;
    sourceId: string | null;
    date: string;
    validUntil: string;
    subject: string;
    intro: string;
    terms: string;
    notes: string;
    discount: number;
    includePpn: boolean;
    ppnRate: number;
    bankId: string | null;
    items: DraftLine[];
  },
) {
  const items = toLines(input.items);
  if (!items.length) return { error: "Tambahkan minimal satu item." };
  const orderId = await updateDb((db) => {
    const row = db.quotations.find((item) => item.id === id);
    if (!row) throw new Error("Penawaran tidak ditemukan");
    row.date = input.date || todayIso();
    row.validUntil = input.validUntil || "";
    row.subject = input.subject.trim();
    row.intro = input.intro.trim();
    row.terms = input.terms.trim();
    row.notes = input.notes.trim();
    row.discount = Number(input.discount) || 0;
    row.includePpn = Boolean(input.includePpn);
    row.ppnRate = Number(input.ppnRate) || 0;
    row.bankId = input.bankId;
    row.items = items;
    return row.orderId;
  });
  refresh();
  redirect(`/order/${orderId}`);
}

export async function deleteQuotation(id: string) {
  const orderId = await updateDb((db) => {
    const row = db.quotations.find((item) => item.id === id);
    const parentId = row?.orderId || null;
    db.quotations = db.quotations.filter((item) => item.id !== id);
    return parentId;
  });
  refresh();
  redirect(orderId ? `/order/${orderId}` : "/order");
}

export async function resetDemoData() {
  await replaceDb(createSeed());
  refresh();
  redirect("/");
}
