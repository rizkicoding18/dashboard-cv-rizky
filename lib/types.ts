export type ProductCategory = "percetakan" | "pengadaan" | "atk" | "jasa";

export type OrderStatus = "baru" | "proses" | "selesai" | "dibatalkan";

export type InvoiceStatus = "draft" | "terbit" | "sebagian" | "lunas" | "batal";

export type PaymentMethod = "tunai" | "transfer" | "giro";

export type StockMoveType = "masuk" | "keluar" | "penyesuaian";

export type ExpenseCategory =
  | "operasional"
  | "gaji"
  | "sewa"
  | "utilitas"
  | "bahan"
  | "lainnya";

export interface CompanyProfile {
  name: string;
  tagline: string;
  owner: string;
  ownerTitle: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  npwp: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  defaultPpnRate: number;
  openingCash: number;
  openingCapital: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holder: string;
  isDefault: boolean;
  notes: string;
}

export interface StoredFile {
  id: string;
  name: string;
  path: string;
  mime: string;
  size: number;
  uploadedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  pic: string;
  phone: string;
  email: string;
  address: string;
  npwp: string;
  notes: string;
  createdAt: string;
}

export interface Product {
  id: string;
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
  photo: StoredFile | null;
  printFiles: StoredFile[];
  createdAt: string;
}

export interface CustomerPrice {
  id: string;
  customerId: string;
  productId: string;
  unitPrice: number;
  notes: string;
}

export interface LineItem {
  id: string;
  productId: string | null;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  unitPrice: number;
  costPrice: number;
}

export interface Order {
  id: string;
  number: string;
  customerId: string;
  date: string;
  dueDate: string;
  status: OrderStatus;
  notes: string;
  items: LineItem[];
  taxInvoice: StoredFile | null;
  spk: StoredFile | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  fakturNumber: string;
  orderId: string | null;
  customerId: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  items: LineItem[];
  discount: number;
  includePpn: boolean;
  ppnRate: number;
  notes: string;
  bankId: string | null;
  paidAmount: number;
  issuedAt: string | null;
  createdAt: string;
}

export interface BaItem {
  id: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  condition: string;
}

export interface BeritaAcara {
  id: string;
  number: string;
  invoiceId: string | null;
  orderId: string | null;
  customerId: string;
  date: string;
  location: string;
  title: string;
  description: string;
  items: BaItem[];
  notes: string;
  createdAt: string;
}

export interface SuratJalanItem {
  id: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  notes: string;
}

export interface SuratJalan {
  id: string;
  number: string;
  invoiceId: string | null;
  orderId: string | null;
  customerId: string;
  date: string;
  destination: string;
  vehicle: string;
  driver: string;
  items: SuratJalanItem[];
  notes: string;
  createdAt: string;
}

export type QuotationKind = "sph" | "negosiasi";

export interface Quotation {
  id: string;
  number: string;
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
  items: LineItem[];
  discount: number;
  includePpn: boolean;
  ppnRate: number;
  bankId: string | null;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  qty: number;
  unit: string;
  unitCost: number;
}

export interface Purchase {
  id: string;
  number: string;
  date: string;
  supplier: string;
  items: PurchaseItem[];
  paid: boolean;
  notes: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
}

export type PayeeKind = "pekerja" | "vendor";

export type WorkType = "desain" | "cetak" | "finishing" | "packing" | "lainnya";

export type PayrollStatus = "draft" | "terbit" | "lunas";

export interface Payee {
  id: string;
  kind: PayeeKind;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
}

export interface PayrollItem {
  id: string;
  payeeId: string;
  payeeName: string;
  kind: PayeeKind;
  workType: WorkType;
  description: string;
  qty: number;
  unit: string;
  rate: number;
}

export interface Payroll {
  id: string;
  number: string;
  date: string;
  orderId: string | null;
  status: PayrollStatus;
  notes: string;
  method: PaymentMethod | "";
  paidAt: string | null;
  items: PayrollItem[];
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  bankId: string | null;
  proof: StoredFile | null;
  notes: string;
}

export interface StockMove {
  id: string;
  productId: string;
  type: StockMoveType;
  qty: number;
  unitCost: number;
  refType: "invoice" | "pembelian" | "manual";
  refId: string;
  notes: string;
  date: string;
}

export interface Database {
  profile: CompanyProfile;
  banks: BankAccount[];
  customers: Customer[];
  products: Product[];
  customerPrices: CustomerPrice[];
  orders: Order[];
  invoices: Invoice[];
  beritaAcaras: BeritaAcara[];
  suratJalans: SuratJalan[];
  quotations: Quotation[];
  purchases: Purchase[];
  expenses: Expense[];
  payments: Payment[];
  stockMoves: StockMove[];
  payees: Payee[];
  payrolls: Payroll[];
}

export type DraftLine = {
  key: string;
  productId: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  unitPrice: number;
  costPrice: number;
};

export type DraftBaLine = {
  key: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  condition: string;
};

export type DraftSjLine = {
  key: string;
  name: string;
  spec: string;
  qty: number;
  unit: string;
  notes: string;
};

export type DraftPayrollLine = {
  key: string;
  payeeId: string;
  workType: WorkType;
  description: string;
  qty: number;
  unit: string;
  rate: number;
};
