"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";
import { ConfirmSubmit } from "@/components/line-items";
import { DownloadPdfButton } from "@/components/document-actions";
import { Badge } from "@/components/form-controls";
import { ButtonLink } from "@/components/shared";
import { DataTable } from "@/components/ui/data-table";
import { type DataTableFeatures } from "@/components/ui/data-table-features";
import { sortableHeader } from "@/components/ui/data-table-column-header";

const itemHelper = createColumnHelper<DataTableFeatures, LineItemRow>();
const docHelper = createColumnHelper<DataTableFeatures, DocumentRow>();
const expenseHelper = createColumnHelper<DataTableFeatures, ExpenseRow>();
const purchaseHelper = createColumnHelper<DataTableFeatures, PurchaseRow>();
const priceHelper = createColumnHelper<DataTableFeatures, PriceRow>();
const stockHelper = createColumnHelper<DataTableFeatures, StockMoveRow>();
const customerPriceHelper = createColumnHelper<DataTableFeatures, CustomerPriceRow>();
const payrollItemHelper = createColumnHelper<DataTableFeatures, PayrollItemRow>();
const taxFileHelper = createColumnHelper<DataTableFeatures, TaxFileRow>();

export type LineItemRow = {
  id: string;
  name: string;
  spec: string;
  qty: string;
  price: string;
  amount: string;
};

export function LineItemsTable({ data }: { data: LineItemRow[] }) {
  return <DataTable columns={itemColumns} data={data} pageSize={0} framed={false} />;
}

const itemColumns = itemHelper.columns([
  itemHelper.accessor("name", {
    header: sortableHeader("Item"),
    cell: ({ row }) => (
      <div>
        <p>{row.original.name}</p>
        {row.original.spec ? <p className="text-xs text-muted-foreground">{row.original.spec}</p> : null}
      </div>
    ),
  }),
  itemHelper.accessor("qty", { header: sortableHeader("Qty") }),
  itemHelper.accessor("price", { header: sortableHeader("Harga") }),
  itemHelper.accessor("amount", { header: sortableHeader("Jumlah") }),
]);

export type DocumentRow = {
  id: string;
  kind: string;
  number: string;
  date: string;
  amount: string;
  openHref: string | null;
  openExternal: boolean;
  printHref: string | null;
  pdfHref: string | null;
  deleteAction: (() => Promise<unknown>) | null;
  deleteMessage: string;
};

export function DocumentsTable({ data }: { data: DocumentRow[] }) {
  return <DataTable columns={docColumns} data={data} search="Cari dokumen" framed={false} />;
}

function DocumentActions({ row }: { row: DocumentRow }) {
  return (
    <div className="flex flex-wrap gap-2">
      {row.openHref ? (
        <ButtonLink href={row.openHref} variant="outline" size="sm">
          Buka
        </ButtonLink>
      ) : null}
      {row.printHref ? (
        <ButtonLink href={row.printHref} variant="outline" size="sm">
          Cetak
        </ButtonLink>
      ) : null}
      {row.pdfHref ? <DownloadPdfButton href={row.pdfHref} label="PDF" size="sm" /> : null}
      {row.deleteAction ? (
        <ConfirmSubmit label="Hapus" message={row.deleteMessage} action={row.deleteAction} />
      ) : null}
    </div>
  );
}

const docColumns = docHelper.columns([
  docHelper.accessor("kind", {
    header: sortableHeader("Jenis"),
    cell: ({ getValue }) => <Badge tone="neutral">{getValue()}</Badge>,
  }),
  docHelper.accessor("number", {
    header: sortableHeader("Nomor"),
    cell: ({ row }) =>
      row.original.openHref ? (
        <Link
          href={row.original.openHref}
          className="font-medium text-primary"
          target={row.original.openExternal ? "_blank" : undefined}
          rel={row.original.openExternal ? "noreferrer" : undefined}
        >
          {row.original.number}
        </Link>
      ) : (
        <span className="font-medium">{row.original.number}</span>
      ),
  }),
  docHelper.accessor("date", { header: sortableHeader("Tanggal") }),
  docHelper.accessor("amount", { header: sortableHeader("Nilai") }),
  docHelper.display({
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => <DocumentActions row={row.original} />,
    enableGlobalFilter: false,
  }),
]);

export type ExpenseRow = {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: string;
  deleteAction: () => Promise<unknown>;
};

export function ExpensesTable({ data }: { data: ExpenseRow[] }) {
  return <DataTable columns={expenseColumns} data={data} search="Cari beban" framed={false} />;
}

const expenseColumns = expenseHelper.columns([
  expenseHelper.accessor("date", { header: sortableHeader("Tanggal") }),
  expenseHelper.accessor("category", { header: sortableHeader("Kategori") }),
  expenseHelper.accessor("description", { header: sortableHeader("Uraian") }),
  expenseHelper.accessor("amount", { header: sortableHeader("Nominal") }),
  expenseHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <ConfirmSubmit label="Hapus" message="Hapus beban ini?" action={row.original.deleteAction} />
      </div>
    ),
    enableGlobalFilter: false,
  }),
]);

export type PurchaseRow = {
  id: string;
  number: string;
  supplier: string;
  date: string;
  total: string;
  status: string;
};

export function PurchasesTable({ data }: { data: PurchaseRow[] }) {
  return <DataTable columns={purchaseColumns} data={data} search="Cari pembelian" framed={false} />;
}

const purchaseColumns = purchaseHelper.columns([
  purchaseHelper.accessor("number", { header: sortableHeader("Nomor") }),
  purchaseHelper.accessor("supplier", { header: sortableHeader("Supplier") }),
  purchaseHelper.accessor("date", { header: sortableHeader("Tanggal") }),
  purchaseHelper.accessor("total", { header: sortableHeader("Total") }),
  purchaseHelper.accessor("status", { header: sortableHeader("Status") }),
]);

export type PriceRow = {
  id: string;
  customer: string;
  notes: string;
  price: string;
  deleteAction: () => Promise<unknown>;
};

export function ProductPricesTable({ data }: { data: PriceRow[] }) {
  return <DataTable columns={priceColumns} data={data} pageSize={0} framed={false} />;
}

const priceColumns = priceHelper.columns([
  priceHelper.accessor("customer", {
    header: sortableHeader("Perusahaan"),
    cell: ({ row }) => (
      <div>
        {row.original.customer}
        {row.original.notes ? <p className="text-xs text-muted-foreground">{row.original.notes}</p> : null}
      </div>
    ),
  }),
  priceHelper.accessor("price", { header: sortableHeader("Harga") }),
  priceHelper.display({
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <ConfirmSubmit label="Hapus" message="Hapus harga khusus ini?" action={row.original.deleteAction} />
      </div>
    ),
    enableGlobalFilter: false,
  }),
]);

export type StockMoveRow = {
  id: string;
  date: string;
  type: string;
  qty: string;
};

export function StockMovesTable({ data }: { data: StockMoveRow[] }) {
  return <DataTable columns={stockColumns} data={data} pageSize={0} framed={false} />;
}

const stockColumns = stockHelper.columns([
  stockHelper.accessor("date", { header: sortableHeader("Tanggal") }),
  stockHelper.accessor("type", {
    header: sortableHeader("Tipe"),
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
  }),
  stockHelper.accessor("qty", { header: sortableHeader("Qty") }),
]);

export type CustomerPriceRow = {
  id: string;
  href: string;
  name: string;
  notes: string;
  special: string;
  general: string;
};

export function CustomerPricesTable({ data }: { data: CustomerPriceRow[] }) {
  return <DataTable columns={customerPriceColumns} data={data} pageSize={0} framed={false} />;
}

const customerPriceColumns = customerPriceHelper.columns([
  customerPriceHelper.accessor("name", {
    header: sortableHeader("Item"),
    cell: ({ row }) => (
      <div>
        <Link href={row.original.href} className="font-medium text-primary">
          {row.original.name}
        </Link>
        {row.original.notes ? <p className="text-xs text-muted-foreground">{row.original.notes}</p> : null}
      </div>
    ),
  }),
  customerPriceHelper.accessor("special", { header: sortableHeader("Harga khusus") }),
  customerPriceHelper.accessor("general", { header: sortableHeader("Harga umum") }),
]);

export type PayrollItemRow = {
  id: string;
  name: string;
  description: string;
  kind: string;
  work: string;
  qty: string;
  rate: string;
  amount: string;
};

export function PayrollItemsTable({ data }: { data: PayrollItemRow[] }) {
  return <DataTable columns={payrollItemColumns} data={data} pageSize={0} framed={false} />;
}

const payrollItemColumns = payrollItemHelper.columns([
  payrollItemHelper.accessor("name", {
    header: sortableHeader("Penerima"),
    cell: ({ row }) => (
      <div>
        {row.original.name}
        {row.original.description ? <p className="text-xs text-muted-foreground">{row.original.description}</p> : null}
      </div>
    ),
  }),
  payrollItemHelper.accessor("kind", { header: sortableHeader("Jenis") }),
  payrollItemHelper.accessor("work", { header: sortableHeader("Pekerjaan") }),
  payrollItemHelper.accessor("qty", { header: sortableHeader("Qty") }),
  payrollItemHelper.accessor("rate", { header: sortableHeader("Tarif") }),
  payrollItemHelper.accessor("amount", { header: sortableHeader("Jumlah") }),
]);

export type TaxFileRow = {
  id: string;
  name: string;
  orderNumber: string;
  customer: string;
  date: string;
  href: string;
  deleteAction: () => Promise<unknown>;
};

export function TaxFilesTable({ data }: { data: TaxFileRow[] }) {
  return <DataTable columns={taxFileColumns} data={data} search="Cari faktur pajak" framed={false} />;
}

const taxFileColumns = taxFileHelper.columns([
  taxFileHelper.accessor("name", { header: sortableHeader("File") }),
  taxFileHelper.accessor("orderNumber", { header: sortableHeader("Order") }),
  taxFileHelper.accessor("customer", { header: sortableHeader("Perusahaan") }),
  taxFileHelper.accessor("date", { header: sortableHeader("Tanggal") }),
  taxFileHelper.display({
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-2">
        <a href={row.original.href} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">
          Buka
        </a>
        <ConfirmSubmit label="Hapus" message="Hapus faktur pajak ini?" action={row.original.deleteAction} />
      </div>
    ),
    enableGlobalFilter: false,
  }),
]);
