"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { type DataTableFeatures } from "@/components/ui/data-table-features";
import { sortableHeader } from "@/components/ui/data-table-column-header";
import { ConfirmSubmit } from "@/components/line-items";
import { Badge } from "@/components/form-controls";
import { InvoiceBadge, OrderBadge, PayrollBadge } from "@/components/status";
import type { InvoiceStatus, OrderStatus, PayrollStatus } from "@/lib/types";

const orderHelper = createColumnHelper<DataTableFeatures, OrderRow>();
const productHelper = createColumnHelper<DataTableFeatures, ProductRow>();
const customerHelper = createColumnHelper<DataTableFeatures, CustomerRow>();
const invoiceHelper = createColumnHelper<DataTableFeatures, InvoiceRow>();
const baHelper = createColumnHelper<DataTableFeatures, BaRow>();
const payrollHelper = createColumnHelper<DataTableFeatures, PayrollRow>();
const bankHelper = createColumnHelper<DataTableFeatures, BankRow>();
const payeeHelper = createColumnHelper<DataTableFeatures, PayeeRow>();

export type OrderRow = {
  id: string;
  href: string;
  number: string;
  customer: string;
  date: string;
  amount: string;
  status: OrderStatus;
  taxMissing: boolean;
};

export function OrdersTable({ data }: { data: OrderRow[] }) {
  return <DataTable columns={orderColumns} data={data} search="Cari order atau perusahaan" />;
}

const orderColumns = orderHelper.columns([
  orderHelper.accessor("number", {
    header: sortableHeader("Nomor"),
    cell: ({ row }) => (
      <Link href={row.original.href} className="font-medium text-primary">
        {row.original.number}
      </Link>
    ),
  }),
  orderHelper.accessor("customer", { header: sortableHeader("Perusahaan") }),
  orderHelper.accessor("date", { header: sortableHeader("Tanggal") }),
  orderHelper.accessor("amount", { header: sortableHeader("Nilai") }),
  orderHelper.accessor("status", {
    header: sortableHeader("Status"),
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-2">
        <OrderBadge status={row.original.status} />
        {row.original.taxMissing ? <Badge tone="warn">Faktur pajak</Badge> : null}
      </div>
    ),
    enableGlobalFilter: false,
  }),
]);

export type ProductRow = {
  id: string;
  href: string;
  name: string;
  sku: string;
  photoUrl: string | null;
  category: string;
  stock: string;
  low: boolean;
  cost: string;
  price: string;
  specials: string;
};

export function ProductsTable({ data }: { data: ProductRow[] }) {
  return <DataTable columns={productColumns} data={data} search="Cari nama atau SKU" />;
}

const productColumns = productHelper.columns([
  productHelper.accessor("name", {
    header: sortableHeader("Barang"),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.original.photoUrl} alt="" className="size-10 shrink-0 rounded-md object-cover" />
        ) : null}
        <div>
          <Link href={row.original.href} className="font-medium text-primary">
            {row.original.name}
          </Link>
          <p className="text-xs text-muted-foreground">{row.original.sku}</p>
        </div>
      </div>
    ),
  }),
  productHelper.accessor("category", { header: sortableHeader("Kategori") }),
  productHelper.accessor("stock", {
    header: sortableHeader("Stok"),
    cell: ({ row }) => (
      <span className={row.original.low ? "text-warn" : undefined}>
        {row.original.stock}
        {row.original.low ? (
          <span className="ml-2">
            <Badge tone="warn">Menipis</Badge>
          </span>
        ) : null}
      </span>
    ),
  }),
  productHelper.accessor("cost", { header: sortableHeader("Modal") }),
  productHelper.accessor("price", { header: sortableHeader("Harga umum") }),
  productHelper.accessor("specials", { header: sortableHeader("Harga khusus") }),
]);

export type CustomerRow = {
  id: string;
  href: string;
  name: string;
  pic: string;
  phone: string;
  specials: string;
  joined: string;
};

export function CustomersTable({ data }: { data: CustomerRow[] }) {
  return <DataTable columns={customerColumns} data={data} search="Cari perusahaan atau PIC" />;
}

const customerColumns = customerHelper.columns([
  customerHelper.accessor("name", {
    header: sortableHeader("Perusahaan"),
    cell: ({ row }) => (
      <Link href={row.original.href} className="font-medium text-primary">
        {row.original.name}
      </Link>
    ),
  }),
  customerHelper.accessor("pic", { header: sortableHeader("PIC") }),
  customerHelper.accessor("phone", { header: sortableHeader("Telepon") }),
  customerHelper.accessor("specials", { header: sortableHeader("Harga khusus") }),
  customerHelper.accessor("joined", { header: sortableHeader("Bergabung") }),
]);

export type InvoiceRow = {
  id: string;
  href: string;
  number: string;
  fakturNumber: string;
  customer: string;
  date: string;
  total: string;
  outstanding: string;
  sjCount: string;
  status: InvoiceStatus;
  deleteAction: () => Promise<unknown>;
  deleteMessage: string;
};

export function InvoicesTable({ data }: { data: InvoiceRow[] }) {
  return <DataTable columns={invoiceColumns} data={data} search="Cari invoice atau perusahaan" />;
}

const invoiceColumns = invoiceHelper.columns([
  invoiceHelper.accessor("number", {
    header: sortableHeader("Invoice"),
    cell: ({ row }) => (
      <Link href={row.original.href} className="font-medium text-primary">
        {row.original.number}
      </Link>
    ),
  }),
  invoiceHelper.accessor("fakturNumber", { header: sortableHeader("Faktur") }),
  invoiceHelper.accessor("customer", { header: sortableHeader("Perusahaan") }),
  invoiceHelper.accessor("date", { header: sortableHeader("Tanggal") }),
  invoiceHelper.accessor("total", { header: sortableHeader("Total") }),
  invoiceHelper.accessor("outstanding", { header: sortableHeader("Sisa") }),
  invoiceHelper.accessor("sjCount", { header: sortableHeader("SJ") }),
  invoiceHelper.accessor("status", {
    header: sortableHeader("Status"),
    cell: ({ row }) => <InvoiceBadge status={row.original.status} />,
    enableGlobalFilter: false,
  }),
  invoiceHelper.display({
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <ConfirmSubmit label="Hapus" message={row.original.deleteMessage} action={row.original.deleteAction} />
    ),
    enableGlobalFilter: false,
  }),
]);

export type BaRow = {
  id: string;
  href: string;
  number: string;
  customer: string;
  date: string;
  title: string;
};

export function BaTable({ data }: { data: BaRow[] }) {
  return <DataTable columns={baColumns} data={data} search="Cari berita acara" />;
}

const baColumns = baHelper.columns([
  baHelper.accessor("number", {
    header: sortableHeader("Nomor"),
    cell: ({ row }) => (
      <Link href={row.original.href} className="font-medium text-primary">
        {row.original.number}
      </Link>
    ),
  }),
  baHelper.accessor("customer", { header: sortableHeader("Perusahaan") }),
  baHelper.accessor("date", { header: sortableHeader("Tanggal") }),
  baHelper.accessor("title", { header: sortableHeader("Judul") }),
]);

export type PayrollRow = {
  id: string;
  href: string;
  number: string;
  date: string;
  wage: string;
  vendor: string;
  total: string;
  status: PayrollStatus;
};

export function PayrollsTable({ data }: { data: PayrollRow[] }) {
  return <DataTable columns={payrollColumns} data={data} search="Cari rincian gaji" />;
}

const payrollColumns = payrollHelper.columns([
  payrollHelper.accessor("number", {
    header: sortableHeader("Nomor"),
    cell: ({ row }) => (
      <Link href={row.original.href} className="font-medium text-primary">
        {row.original.number}
      </Link>
    ),
  }),
  payrollHelper.accessor("date", { header: sortableHeader("Tanggal") }),
  payrollHelper.accessor("wage", { header: sortableHeader("Upah") }),
  payrollHelper.accessor("vendor", { header: sortableHeader("Nota luar") }),
  payrollHelper.accessor("total", { header: sortableHeader("Total") }),
  payrollHelper.accessor("status", {
    header: sortableHeader("Status"),
    cell: ({ row }) => <PayrollBadge status={row.original.status} />,
    enableGlobalFilter: false,
  }),
]);

export type BankRow = {
  id: string;
  href: string;
  bankName: string;
  notes: string;
  accountNumber: string;
  holder: string;
  isDefault: boolean;
};

export function BanksTable({ data }: { data: BankRow[] }) {
  return <DataTable columns={bankColumns} data={data} search="Cari rekening" />;
}

const bankColumns = bankHelper.columns([
  bankHelper.accessor("bankName", {
    header: sortableHeader("Bank"),
    cell: ({ row }) => (
      <div>
        <Link href={row.original.href} className="font-medium text-primary">
          {row.original.bankName}
        </Link>
        {row.original.notes ? <p className="text-xs text-muted-foreground">{row.original.notes}</p> : null}
      </div>
    ),
  }),
  bankHelper.accessor("accountNumber", {
    header: sortableHeader("No. rekening"),
    cell: ({ getValue }) => <span className="font-mono">{getValue()}</span>,
  }),
  bankHelper.accessor("holder", { header: sortableHeader("Atas nama") }),
  bankHelper.accessor("isDefault", {
    header: sortableHeader("Status"),
    cell: ({ getValue }) => (getValue() ? <Badge>Default</Badge> : "—"),
    enableGlobalFilter: false,
  }),
]);

export type PayeeRow = {
  id: string;
  href: string;
  name: string;
  notes: string;
  kind: string;
  phone: string;
};

export function PayeesTable({ data }: { data: PayeeRow[] }) {
  return <DataTable columns={payeeColumns} data={data} search="Cari penerima" />;
}

const payeeColumns = payeeHelper.columns([
  payeeHelper.accessor("name", {
    header: sortableHeader("Nama"),
    cell: ({ row }) => (
      <div>
        <Link href={row.original.href} className="font-medium text-primary">
          {row.original.name}
        </Link>
        {row.original.notes ? <p className="text-xs text-muted-foreground">{row.original.notes}</p> : null}
      </div>
    ),
  }),
  payeeHelper.accessor("kind", {
    header: sortableHeader("Jenis"),
    cell: ({ getValue }) => <Badge tone="neutral">{getValue()}</Badge>,
  }),
  payeeHelper.accessor("phone", { header: sortableHeader("Telepon") }),
]);
