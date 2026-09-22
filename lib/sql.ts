import { createClient, type Client, type InArgs, type InStatement } from "@libsql/client";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  BankAccount,
  BeritaAcara,
  Customer,
  CustomerPrice,
  Database,
  Expense,
  Invoice,
  Order,
  Payee,
  Payment,
  Payroll,
  Product,
  Purchase,
  Quotation,
  Receipt,
  StockMove,
  SuratJalan,
} from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const jsonLegacyPath = path.join(dataDir, "db.json");
const sqlitePath = path.join(dataDir, "app.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  owner_title TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  npwp TEXT NOT NULL DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT '',
  bank_account TEXT NOT NULL DEFAULT '',
  bank_holder TEXT NOT NULL DEFAULT '',
  default_ppn_rate REAL NOT NULL DEFAULT 0.11,
  opening_cash REAL NOT NULL DEFAULT 0,
  opening_capital REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS banks (
  id TEXT PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  holder TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pic TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  npwp TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  stock REAL NOT NULL DEFAULT 0,
  min_stock REAL NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  default_price REAL NOT NULL DEFAULT 0,
  track_stock INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  print_files TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_prices (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  unit_price REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  tax_invoice TEXT NOT NULL DEFAULT '',
  spk TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  faktur_number TEXT NOT NULL DEFAULT '',
  order_id TEXT,
  customer_id TEXT NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  items TEXT NOT NULL DEFAULT '[]',
  discount REAL NOT NULL DEFAULT 0,
  include_ppn INTEGER NOT NULL DEFAULT 0,
  ppn_rate REAL NOT NULL DEFAULT 0.11,
  notes TEXT NOT NULL DEFAULT '',
  bank_id TEXT,
  paid_amount REAL NOT NULL DEFAULT 0,
  issued_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS berita_acaras (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  invoice_id TEXT,
  order_id TEXT,
  customer_id TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS surat_jalans (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  invoice_id TEXT,
  order_id TEXT,
  customer_id TEXT NOT NULL,
  date TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT '',
  vehicle TEXT NOT NULL DEFAULT '',
  driver TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  payment_id TEXT,
  customer_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'transfer',
  bank_id TEXT,
  description TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  kind TEXT NOT NULL,
  order_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  source_id TEXT,
  date TEXT NOT NULL,
  valid_until TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  intro TEXT NOT NULL DEFAULT '',
  terms TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  discount REAL NOT NULL DEFAULT 0,
  include_ppn INTEGER NOT NULL DEFAULT 0,
  ppn_rate REAL NOT NULL DEFAULT 0.11,
  bank_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  date TEXT NOT NULL,
  supplier TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  paid INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  method TEXT NOT NULL,
  bank_id TEXT,
  proof TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS stock_moves (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  type TEXT NOT NULL,
  qty REAL NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL DEFAULT 0,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payees (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payrolls (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  date TEXT NOT NULL,
  order_id TEXT,
  status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT '',
  paid_at TEXT,
  items TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stored_files (
  path TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INTEGER NOT NULL DEFAULT 0,
  bytes BLOB NOT NULL,
  uploaded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_surat_jalans_invoice ON surat_jalans(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_order ON quotations(order_id);
`;

let clientPromise: Promise<Client> | null = null;

function isRemoteUrl(url: string) {
  return url.startsWith("libsql://") || url.startsWith("https://") || url.startsWith("http://");
}

function databaseUrl() {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;
  return `file:${sqlitePath}`;
}

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const url = databaseUrl();
      if (!isRemoteUrl(url)) {
        await fs.mkdir(dataDir, { recursive: true });
      }
      const client = createClient({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      for (const statement of SCHEMA.split(";").map((part) => part.trim()).filter(Boolean)) {
        await client.execute(statement);
      }
      for (const statement of [
        "ALTER TABLE products ADD COLUMN photo TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE products ADD COLUMN print_files TEXT NOT NULL DEFAULT '[]'",
        "ALTER TABLE orders ADD COLUMN tax_invoice TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE orders ADD COLUMN spk TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE payments ADD COLUMN bank_id TEXT",
        "ALTER TABLE payments ADD COLUMN proof TEXT NOT NULL DEFAULT ''",
      ]) {
        await client.execute(statement).catch(() => undefined);
      }
      return client;
    })();
  }
  return clientPromise;
}

function toBytes(value: unknown): Uint8Array | null {
  if (value == null) return null;
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Buffer.isBuffer(value)) return new Uint8Array(value);
  if (typeof value === "string") {
    try {
      return new Uint8Array(Buffer.from(value, "base64"));
    } catch {
      return null;
    }
  }
  return null;
}

export async function putStoredFile(rel: string, bytes: Uint8Array, mime: string, name: string) {
  const client = await getClient();
  await client.execute({
    sql: `INSERT INTO stored_files (path, name, mime, size, bytes, uploaded_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(path) DO UPDATE SET
            name = excluded.name,
            mime = excluded.mime,
            size = excluded.size,
            bytes = excluded.bytes,
            uploaded_at = excluded.uploaded_at`,
    args: [rel, name, mime || "application/octet-stream", bytes.byteLength, bytes, new Date().toISOString()],
  });
}

export async function getStoredFile(rel: string) {
  const client = await getClient();
  const rs = await client.execute({
    sql: "SELECT name, mime, size, bytes FROM stored_files WHERE path = ?",
    args: [rel],
  });
  const row = rs.rows[0];
  if (!row) return null;
  const bytes = toBytes(row.bytes);
  if (!bytes) return null;
  return {
    name: str(row.name),
    mime: str(row.mime, "application/octet-stream"),
    size: num(row.size, bytes.byteLength),
    bytes,
  };
}

export async function deleteStoredFile(rel: string) {
  const client = await getClient();
  await client.execute({
    sql: "DELETE FROM stored_files WHERE path = ?",
    args: [rel],
  });
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function num(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function bool(value: unknown) {
  return value === 1 || value === true || value === "1";
}

function json<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function insert(table: string, columns: string[], values: unknown[]): InStatement {
  const placeholders = columns.map(() => "?").join(", ");
  return {
    sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    args: values as InArgs,
  };
}

export async function loadLegacyJson(): Promise<Database | null> {
  try {
    const raw = await fs.readFile(jsonLegacyPath, "utf8");
    return JSON.parse(raw) as Database;
  } catch {
    return null;
  }
}

export async function loadSqlDatabase(): Promise<Database | null> {
  const client = await getClient();
  const profileRs = await client.execute("SELECT * FROM profile WHERE id = 1");
  const profileRow = profileRs.rows[0];
  if (!profileRow) return null;

  const [
    banks,
    customers,
    products,
    customerPrices,
    orders,
    invoices,
    beritaAcaras,
    suratJalans,
    receipts,
    quotations,
    purchases,
    expenses,
    payments,
    stockMoves,
    payees,
    payrolls,
  ] = await Promise.all([
    client.execute("SELECT * FROM banks"),
    client.execute("SELECT * FROM customers"),
    client.execute("SELECT * FROM products"),
    client.execute("SELECT * FROM customer_prices"),
    client.execute("SELECT * FROM orders"),
    client.execute("SELECT * FROM invoices"),
    client.execute("SELECT * FROM berita_acaras"),
    client.execute("SELECT * FROM surat_jalans"),
    client.execute("SELECT * FROM receipts"),
    client.execute("SELECT * FROM quotations"),
    client.execute("SELECT * FROM purchases"),
    client.execute("SELECT * FROM expenses"),
    client.execute("SELECT * FROM payments"),
    client.execute("SELECT * FROM stock_moves"),
    client.execute("SELECT * FROM payees"),
    client.execute("SELECT * FROM payrolls"),
  ]);

  return {
    profile: {
      name: str(profileRow.name),
      tagline: str(profileRow.tagline),
      owner: str(profileRow.owner),
      ownerTitle: str(profileRow.owner_title),
      address: str(profileRow.address),
      city: str(profileRow.city),
      phone: str(profileRow.phone),
      email: str(profileRow.email),
      npwp: str(profileRow.npwp),
      bankName: str(profileRow.bank_name),
      bankAccount: str(profileRow.bank_account),
      bankHolder: str(profileRow.bank_holder),
      defaultPpnRate: num(profileRow.default_ppn_rate, 0.11),
      openingCash: num(profileRow.opening_cash),
      openingCapital: num(profileRow.opening_capital),
    },
    banks: banks.rows.map((row) => ({
      id: str(row.id),
      bankName: str(row.bank_name),
      accountNumber: str(row.account_number),
      holder: str(row.holder),
      isDefault: bool(row.is_default),
      notes: str(row.notes),
    })) as BankAccount[],
    customers: customers.rows.map((row) => ({
      id: str(row.id),
      name: str(row.name),
      pic: str(row.pic),
      phone: str(row.phone),
      email: str(row.email),
      address: str(row.address),
      npwp: str(row.npwp),
      notes: str(row.notes),
      createdAt: str(row.created_at),
    })) as Customer[],
    products: products.rows.map((row) => ({
      id: str(row.id),
      sku: str(row.sku),
      name: str(row.name),
      category: str(row.category) as Product["category"],
      unit: str(row.unit),
      stock: num(row.stock),
      minStock: num(row.min_stock),
      costPrice: num(row.cost_price),
      defaultPrice: num(row.default_price),
      trackStock: bool(row.track_stock),
      description: str(row.description),
      photo: json<Product["photo"]>(row.photo, null),
      printFiles: json(row.print_files, []),
      createdAt: str(row.created_at),
    })),
    customerPrices: customerPrices.rows.map((row) => ({
      id: str(row.id),
      customerId: str(row.customer_id),
      productId: str(row.product_id),
      unitPrice: num(row.unit_price),
      notes: str(row.notes),
    })) as CustomerPrice[],
    orders: orders.rows.map((row) => ({
      id: str(row.id),
      number: str(row.number),
      customerId: str(row.customer_id),
      date: str(row.date),
      dueDate: str(row.due_date),
      status: str(row.status) as Order["status"],
      notes: str(row.notes),
      items: json(row.items, []),
      taxInvoice: json<Order["taxInvoice"]>(row.tax_invoice, null),
      spk: json<Order["spk"]>(row.spk, null),
      createdAt: str(row.created_at),
    })),
    invoices: invoices.rows.map((row) => ({
      id: str(row.id),
      number: str(row.number),
      fakturNumber: str(row.faktur_number),
      orderId: row.order_id == null ? null : str(row.order_id),
      customerId: str(row.customer_id),
      date: str(row.date),
      dueDate: str(row.due_date),
      status: str(row.status) as Invoice["status"],
      items: json(row.items, []),
      discount: num(row.discount),
      includePpn: bool(row.include_ppn),
      ppnRate: num(row.ppn_rate, 0.11),
      notes: str(row.notes),
      bankId: row.bank_id == null ? null : str(row.bank_id),
      paidAmount: num(row.paid_amount),
      issuedAt: row.issued_at == null ? null : str(row.issued_at),
      createdAt: str(row.created_at),
    })),
    beritaAcaras: beritaAcaras.rows.map((row) => ({
      id: str(row.id),
      number: str(row.number),
      invoiceId: row.invoice_id == null ? null : str(row.invoice_id),
      orderId: row.order_id == null ? null : str(row.order_id),
      customerId: str(row.customer_id),
      date: str(row.date),
      location: str(row.location),
      title: str(row.title),
      description: str(row.description),
      items: json(row.items, []),
      notes: str(row.notes),
      createdAt: str(row.created_at),
    })) as BeritaAcara[],
    suratJalans: suratJalans.rows.map((row) => ({
      id: str(row.id),
      number: str(row.number),
      invoiceId: row.invoice_id == null ? null : str(row.invoice_id),
      orderId: row.order_id == null ? null : str(row.order_id),
      customerId: str(row.customer_id),
      date: str(row.date),
      destination: str(row.destination),
      vehicle: str(row.vehicle),
      driver: str(row.driver),
      items: json(row.items, []),
      notes: str(row.notes),
      createdAt: str(row.created_at),
    })) as SuratJalan[],
    receipts: receipts.rows.map((row) => ({
      id: str(row.id),
      number: str(row.number),
      invoiceId: str(row.invoice_id),
      paymentId: row.payment_id == null || row.payment_id === "" ? null : str(row.payment_id),
      customerId: str(row.customer_id),
      date: str(row.date),
      amount: num(row.amount),
      method: str(row.method) as Receipt["method"],
      bankId: row.bank_id == null || row.bank_id === "" ? null : str(row.bank_id),
      description: str(row.description),
      notes: str(row.notes),
      createdAt: str(row.created_at),
    })),
    quotations: quotations.rows.map((row) => ({
      id: str(row.id),
      number: str(row.number),
      kind: str(row.kind) as Quotation["kind"],
      orderId: str(row.order_id),
      customerId: str(row.customer_id),
      sourceId: row.source_id == null ? null : str(row.source_id),
      date: str(row.date),
      validUntil: str(row.valid_until),
      subject: str(row.subject),
      intro: str(row.intro),
      terms: str(row.terms),
      notes: str(row.notes),
      items: json(row.items, []),
      discount: num(row.discount),
      includePpn: bool(row.include_ppn),
      ppnRate: num(row.ppn_rate, 0.11),
      bankId: row.bank_id == null ? null : str(row.bank_id),
      createdAt: str(row.created_at),
    })),
    purchases: purchases.rows.map((row) => ({
      id: str(row.id),
      number: str(row.number),
      date: str(row.date),
      supplier: str(row.supplier),
      items: json(row.items, []),
      paid: bool(row.paid),
      notes: str(row.notes),
      createdAt: str(row.created_at),
    })) as Purchase[],
    expenses: expenses.rows.map((row) => ({
      id: str(row.id),
      date: str(row.date),
      category: str(row.category) as Expense["category"],
      description: str(row.description),
      amount: num(row.amount),
    })),
    payments: payments.rows.map((row) => ({
      id: str(row.id),
      invoiceId: str(row.invoice_id),
      date: str(row.date),
      amount: num(row.amount),
      method: str(row.method) as Payment["method"],
      bankId: row.bank_id == null || row.bank_id === "" ? null : str(row.bank_id),
      proof: json<Payment["proof"]>(row.proof, null),
      notes: str(row.notes),
    })),
    stockMoves: stockMoves.rows.map((row) => ({
      id: str(row.id),
      productId: str(row.product_id),
      type: str(row.type) as StockMove["type"],
      qty: num(row.qty),
      unitCost: num(row.unit_cost),
      refType: str(row.ref_type) as StockMove["refType"],
      refId: str(row.ref_id),
      notes: str(row.notes),
      date: str(row.date),
    })),
    payees: payees.rows.map((row) => ({
      id: str(row.id),
      kind: str(row.kind) as Payee["kind"],
      name: str(row.name),
      phone: str(row.phone),
      notes: str(row.notes),
      createdAt: str(row.created_at),
    })),
    payrolls: payrolls.rows.map((row) => ({
      id: str(row.id),
      number: str(row.number),
      date: str(row.date),
      orderId: row.order_id == null ? null : str(row.order_id),
      status: str(row.status) as Payroll["status"],
      notes: str(row.notes),
      method: str(row.method) as Payroll["method"],
      paidAt: row.paid_at == null || row.paid_at === "" ? null : str(row.paid_at),
      items: json(row.items, []),
      createdAt: str(row.created_at),
    })),
  };
}

export async function saveSqlDatabase(db: Database) {
  const client = await getClient();
  const statements: InStatement[] = [
    { sql: "DELETE FROM payrolls" },
    { sql: "DELETE FROM payees" },
    { sql: "DELETE FROM stock_moves" },
    { sql: "DELETE FROM payments" },
    { sql: "DELETE FROM expenses" },
    { sql: "DELETE FROM purchases" },
    { sql: "DELETE FROM quotations" },
    { sql: "DELETE FROM receipts" },
    { sql: "DELETE FROM surat_jalans" },
    { sql: "DELETE FROM berita_acaras" },
    { sql: "DELETE FROM invoices" },
    { sql: "DELETE FROM orders" },
    { sql: "DELETE FROM customer_prices" },
    { sql: "DELETE FROM products" },
    { sql: "DELETE FROM customers" },
    { sql: "DELETE FROM banks" },
    { sql: "DELETE FROM profile" },
    insert(
      "profile",
      [
        "id",
        "name",
        "tagline",
        "owner",
        "owner_title",
        "address",
        "city",
        "phone",
        "email",
        "npwp",
        "bank_name",
        "bank_account",
        "bank_holder",
        "default_ppn_rate",
        "opening_cash",
        "opening_capital",
      ],
      [
        1,
        db.profile.name,
        db.profile.tagline,
        db.profile.owner,
        db.profile.ownerTitle,
        db.profile.address,
        db.profile.city,
        db.profile.phone,
        db.profile.email,
        db.profile.npwp,
        db.profile.bankName,
        db.profile.bankAccount,
        db.profile.bankHolder,
        db.profile.defaultPpnRate,
        db.profile.openingCash,
        db.profile.openingCapital,
      ],
    ),
    ...db.banks.map((bank) =>
      insert(
        "banks",
        ["id", "bank_name", "account_number", "holder", "is_default", "notes"],
        [bank.id, bank.bankName, bank.accountNumber, bank.holder, bank.isDefault ? 1 : 0, bank.notes],
      ),
    ),
    ...db.customers.map((customer) =>
      insert(
        "customers",
        ["id", "name", "pic", "phone", "email", "address", "npwp", "notes", "created_at"],
        [
          customer.id,
          customer.name,
          customer.pic,
          customer.phone,
          customer.email,
          customer.address,
          customer.npwp,
          customer.notes,
          customer.createdAt,
        ],
      ),
    ),
    ...db.products.map((product) =>
      insert(
        "products",
        [
          "id",
          "sku",
          "name",
          "category",
          "unit",
          "stock",
          "min_stock",
          "cost_price",
          "default_price",
          "track_stock",
          "description",
          "photo",
          "print_files",
          "created_at",
        ],
        [
          product.id,
          product.sku,
          product.name,
          product.category,
          product.unit,
          product.stock,
          product.minStock,
          product.costPrice,
          product.defaultPrice,
          product.trackStock ? 1 : 0,
          product.description,
          JSON.stringify(product.photo),
          JSON.stringify(product.printFiles ?? []),
          product.createdAt,
        ],
      ),
    ),
    ...db.customerPrices.map((price) =>
      insert(
        "customer_prices",
        ["id", "customer_id", "product_id", "unit_price", "notes"],
        [price.id, price.customerId, price.productId, price.unitPrice, price.notes],
      ),
    ),
    ...db.orders.map((order) =>
      insert(
        "orders",
        ["id", "number", "customer_id", "date", "due_date", "status", "notes", "items", "tax_invoice", "spk", "created_at"],
        [
          order.id,
          order.number,
          order.customerId,
          order.date,
          order.dueDate,
          order.status,
          order.notes,
          JSON.stringify(order.items),
          JSON.stringify(order.taxInvoice ?? null),
          JSON.stringify(order.spk ?? null),
          order.createdAt,
        ],
      ),
    ),
    ...db.invoices.map((invoice) =>
      insert(
        "invoices",
        [
          "id",
          "number",
          "faktur_number",
          "order_id",
          "customer_id",
          "date",
          "due_date",
          "status",
          "items",
          "discount",
          "include_ppn",
          "ppn_rate",
          "notes",
          "bank_id",
          "paid_amount",
          "issued_at",
          "created_at",
        ],
        [
          invoice.id,
          invoice.number,
          invoice.fakturNumber,
          invoice.orderId,
          invoice.customerId,
          invoice.date,
          invoice.dueDate,
          invoice.status,
          JSON.stringify(invoice.items),
          invoice.discount,
          invoice.includePpn ? 1 : 0,
          invoice.ppnRate,
          invoice.notes,
          invoice.bankId,
          invoice.paidAmount,
          invoice.issuedAt,
          invoice.createdAt,
        ],
      ),
    ),
    ...db.beritaAcaras.map((ba) =>
      insert(
        "berita_acaras",
        [
          "id",
          "number",
          "invoice_id",
          "order_id",
          "customer_id",
          "date",
          "location",
          "title",
          "description",
          "items",
          "notes",
          "created_at",
        ],
        [
          ba.id,
          ba.number,
          ba.invoiceId,
          ba.orderId,
          ba.customerId,
          ba.date,
          ba.location,
          ba.title,
          ba.description,
          JSON.stringify(ba.items),
          ba.notes,
          ba.createdAt,
        ],
      ),
    ),
    ...db.suratJalans.map((sj) =>
      insert(
        "surat_jalans",
        [
          "id",
          "number",
          "invoice_id",
          "order_id",
          "customer_id",
          "date",
          "destination",
          "vehicle",
          "driver",
          "items",
          "notes",
          "created_at",
        ],
        [
          sj.id,
          sj.number,
          sj.invoiceId,
          sj.orderId,
          sj.customerId,
          sj.date,
          sj.destination,
          sj.vehicle,
          sj.driver,
          JSON.stringify(sj.items),
          sj.notes,
          sj.createdAt,
        ],
      ),
    ),
    ...(db.receipts ?? []).map((receipt) =>
      insert(
        "receipts",
        [
          "id",
          "number",
          "invoice_id",
          "payment_id",
          "customer_id",
          "date",
          "amount",
          "method",
          "bank_id",
          "description",
          "notes",
          "created_at",
        ],
        [
          receipt.id,
          receipt.number,
          receipt.invoiceId,
          receipt.paymentId,
          receipt.customerId,
          receipt.date,
          receipt.amount,
          receipt.method,
          receipt.bankId,
          receipt.description,
          receipt.notes,
          receipt.createdAt,
        ],
      ),
    ),
    ...(db.quotations ?? []).map((quotation) =>
      insert(
        "quotations",
        [
          "id",
          "number",
          "kind",
          "order_id",
          "customer_id",
          "source_id",
          "date",
          "valid_until",
          "subject",
          "intro",
          "terms",
          "notes",
          "items",
          "discount",
          "include_ppn",
          "ppn_rate",
          "bank_id",
          "created_at",
        ],
        [
          quotation.id,
          quotation.number,
          quotation.kind,
          quotation.orderId,
          quotation.customerId,
          quotation.sourceId,
          quotation.date,
          quotation.validUntil,
          quotation.subject,
          quotation.intro,
          quotation.terms,
          quotation.notes,
          JSON.stringify(quotation.items),
          quotation.discount,
          quotation.includePpn ? 1 : 0,
          quotation.ppnRate,
          quotation.bankId,
          quotation.createdAt,
        ],
      ),
    ),
    ...db.purchases.map((purchase) =>
      insert(
        "purchases",
        ["id", "number", "date", "supplier", "items", "paid", "notes", "created_at"],
        [
          purchase.id,
          purchase.number,
          purchase.date,
          purchase.supplier,
          JSON.stringify(purchase.items),
          purchase.paid ? 1 : 0,
          purchase.notes,
          purchase.createdAt,
        ],
      ),
    ),
    ...db.expenses.map((expense) =>
      insert(
        "expenses",
        ["id", "date", "category", "description", "amount"],
        [expense.id, expense.date, expense.category, expense.description, expense.amount],
      ),
    ),
    ...db.payments.map((payment) =>
      insert(
        "payments",
        ["id", "invoice_id", "date", "amount", "method", "bank_id", "proof", "notes"],
        [
          payment.id,
          payment.invoiceId,
          payment.date,
          payment.amount,
          payment.method,
          payment.bankId,
          JSON.stringify(payment.proof ?? null),
          payment.notes,
        ],
      ),
    ),
    ...db.stockMoves.map((move) =>
      insert(
        "stock_moves",
        ["id", "product_id", "type", "qty", "unit_cost", "ref_type", "ref_id", "notes", "date"],
        [
          move.id,
          move.productId,
          move.type,
          move.qty,
          move.unitCost,
          move.refType,
          move.refId,
          move.notes,
          move.date,
        ],
      ),
    ),
    ...(db.payees ?? []).map((payee) =>
      insert(
        "payees",
        ["id", "kind", "name", "phone", "notes", "created_at"],
        [payee.id, payee.kind, payee.name, payee.phone, payee.notes, payee.createdAt],
      ),
    ),
    ...(db.payrolls ?? []).map((payroll) =>
      insert(
        "payrolls",
        ["id", "number", "date", "order_id", "status", "notes", "method", "paid_at", "items", "created_at"],
        [
          payroll.id,
          payroll.number,
          payroll.date,
          payroll.orderId,
          payroll.status,
          payroll.notes,
          payroll.method,
          payroll.paidAt,
          JSON.stringify(payroll.items),
          payroll.createdAt,
        ],
      ),
    ),
  ];

  await client.batch(statements, "write");
}
