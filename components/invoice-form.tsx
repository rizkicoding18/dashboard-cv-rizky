"use client";

import { useMemo, useState, useTransition } from "react";
import { createInvoice, issueInvoice, updateInvoice } from "@/app/actions";
import { LineItemsEditor } from "@/components/line-items";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/form-controls";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addDays, formatNumber, formatRupiah, todayIso } from "@/lib/format";
import { invoiceDpp, invoicePpn, invoiceSubtotal } from "@/lib/finance";
import {
  unitPriceForMode,
  type InvoiceOrderOption,
  type InvoicePriceMode,
} from "@/lib/quotations";
import { cn } from "@/lib/utils";
import type { BankAccount, Customer, CustomerPrice, DraftLine, Invoice, Product } from "@/lib/types";

function emptyLine(key = "line-1"): DraftLine {
  return {
    key,
    productId: "",
    name: "",
    spec: "",
    qty: 1,
    unit: "pcs",
    unitPrice: 0,
    costPrice: 0,
  };
}

export function InvoiceForm({
  customers,
  products,
  prices,
  banks = [],
  invoice,
  orders = [],
  defaultOrderId,
  defaultPpnRate,
}: {
  customers: Customer[];
  products: Product[];
  prices: CustomerPrice[];
  banks: BankAccount[];
  invoice?: Invoice;
  orders?: InvoiceOrderOption[];
  defaultOrderId?: string;
  defaultPpnRate: number;
}) {
  if (invoice) {
    return (
      <InvoiceDraftForm
        customers={customers}
        products={products}
        prices={prices}
        banks={banks}
        invoice={invoice}
        defaultPpnRate={defaultPpnRate}
      />
    );
  }

  return (
    <InvoiceCreateForm
      orders={orders}
      banks={banks}
      defaultOrderId={defaultOrderId}
      defaultPpnRate={defaultPpnRate}
    />
  );
}

function InvoiceCreateForm({
  orders,
  banks,
  defaultOrderId,
  defaultPpnRate,
}: {
  orders: InvoiceOrderOption[];
  banks: BankAccount[];
  defaultOrderId?: string;
  defaultPpnRate: number;
}) {
  const [orderId, setOrderId] = useState(defaultOrderId || "");
  const order = orders.find((row) => row.id === orderId) || null;
  const [priceMode, setPriceMode] = useState<InvoicePriceMode>(
    order?.hasNgs ? "negosiasi" : "net",
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [bankId, setBankId] = useState(banks.find((bank) => bank.isDefault)?.id || banks[0]?.id || "");
  const [includePpn, setIncludePpn] = useState(order?.hasNgs ? order.ngsIncludePpn : true);
  const [ppnRate, setPpnRate] = useState(order?.hasNgs ? order.ngsPpnRate : defaultPpnRate);
  const [discount, setDiscount] = useState(order?.hasNgs ? order.ngsDiscount : 0);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function applyOrder(nextId: string) {
    const next = orders.find((row) => row.id === nextId) || null;
    setOrderId(nextId);
    setSelected(new Set());
    setQtyById({});
    setError("");
    if (!next) {
      setPriceMode("net");
      setIncludePpn(true);
      setPpnRate(defaultPpnRate);
      setDiscount(0);
      return;
    }
    const mode: InvoicePriceMode = next.hasNgs ? "negosiasi" : "net";
    setPriceMode(mode);
    setIncludePpn(mode === "negosiasi" ? next.ngsIncludePpn : true);
    setPpnRate(mode === "negosiasi" ? next.ngsPpnRate : defaultPpnRate);
    setDiscount(mode === "negosiasi" ? next.ngsDiscount : 0);
  }

  function applyPriceMode(mode: InvoicePriceMode) {
    if (!order) return;
    setPriceMode(mode);
    setIncludePpn(mode === "negosiasi" ? order.ngsIncludePpn : true);
    setPpnRate(mode === "negosiasi" ? order.ngsPpnRate : defaultPpnRate);
    setDiscount(mode === "negosiasi" ? order.ngsDiscount : 0);
  }

  const openItems = order?.items.filter((item) => item.remainingQty > 0) || [];

  function toggleItem(id: string) {
    const item = order?.items.find((row) => row.id === id);
    if (!item || item.remainingQty <= 0) return;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const items = useMemo<DraftLine[]>(() => {
    if (!order) return [];
    return order.items
      .filter((item) => selected.has(item.id) && item.remainingQty > 0)
      .map((item) => {
        const qty = Math.min(qtyById[item.id] ?? item.remainingQty, item.remainingQty);
        return {
          key: item.id,
          productId: item.productId,
          name: item.name,
          spec: item.spec,
          qty,
          unit: item.unit,
          unitPrice: unitPriceForMode(item, priceMode),
          costPrice: item.costPrice,
          sourceItemId: item.id,
        };
      });
  }, [order, priceMode, qtyById, selected]);

  const preview = useMemo(() => {
    const fake = {
      items: items.map((item) => ({
        id: item.key,
        productId: item.productId || null,
        name: item.name,
        spec: item.spec,
        qty: item.qty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
      })),
      discount,
      includePpn,
      ppnRate,
    };
    const subtotal = invoiceSubtotal(fake.items);
    const dpp = invoiceDpp(fake);
    const ppn = invoicePpn(fake);
    return { subtotal, dpp, ppn, total: dpp + ppn };
  }, [discount, includePpn, items, ppnRate]);

  function submit(issue: boolean) {
    if (!order) {
      setError("Pilih order.");
      return;
    }
    if (!items.length) {
      setError("Klik item yang akan ditagih pada invoice ini.");
      return;
    }
    setError("");
    start(async () => {
      const result = await createInvoice({
        customerId: order.customerId,
        orderId: order.id,
        date: (document.getElementById("invoice-date") as HTMLInputElement)?.value || todayIso(),
        dueDate: (document.getElementById("invoice-due") as HTMLInputElement)?.value || "",
        notes: (document.getElementById("invoice-notes") as HTMLTextAreaElement)?.value || "",
        discount,
        includePpn,
        ppnRate,
        bankId: bankId || null,
        items,
        issue,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="grid gap-5">
      <Card className="grid gap-4 p-5">
        <Field label="Order" hint="Nomor order dan perusahaan yang akan ditagih.">
          <Select value={orderId} onChange={(event) => applyOrder(event.target.value)}>
            <option value="">Pilih order</option>
            {orders.map((row) => (
              <option key={row.id} value={row.id}>
                {row.number} — {row.customerName}
                {row.invoiceCount ? ` · ${row.invoiceCount} invoice` : ""}
              </option>
            ))}
          </Select>
        </Field>
        {order ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Perusahaan</p>
              <p className="mt-1 font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Harga dipakai</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={priceMode === "net" ? "primary" : "outline"}
                  aria-pressed={priceMode === "net"}
                  onClick={() => applyPriceMode("net")}
                >
                  Harga net
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={priceMode === "negosiasi" ? "primary" : "outline"}
                  disabled={!order.hasNgs}
                  aria-pressed={priceMode === "negosiasi"}
                  onClick={() => applyPriceMode("negosiasi")}
                >
                  Harga negosiasi
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {order.hasNgs
                  ? `Harga negosiasi dari ${order.ngsNumber}.`
                  : "Belum ada penawaran negosiasi. Invoice memakai harga net order."}
              </p>
            </div>
          </div>
        ) : null}
      </Card>

      {order ? (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-heading text-xl">Item ditagih</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Klik item untuk invoice ini. Item yang belum dipilih bisa ditagih di invoice berikutnya.
              </p>
            </div>
            {openItems.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelected(
                    selected.size === openItems.length
                      ? new Set()
                      : new Set(openItems.map((item) => item.id)),
                  )
                }
              >
                {selected.size === openItems.length ? "Kosongkan" : "Pilih sisa item"}
              </Button>
            ) : null}
          </div>
          {order.items.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">Order ini belum punya item.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Sisa</TableHead>
                    <TableHead>Harga net</TableHead>
                    {order.hasNgs ? <TableHead>Harga NGS</TableHead> : null}
                    <TableHead>Harga dipakai</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => {
                    const checked = selected.has(item.id);
                    const disabled = item.remainingQty <= 0;
                    const qty = Math.min(qtyById[item.id] ?? item.remainingQty, item.remainingQty);
                    const price = unitPriceForMode(item, priceMode);
                    const amount = checked ? Math.round(qty * price) : 0;
                    return (
                      <TableRow
                        key={item.id}
                        data-state={checked ? "selected" : undefined}
                        className={cn(
                          disabled ? "cursor-default opacity-60" : "cursor-pointer",
                          checked && "bg-primary/5",
                        )}
                        onClick={() => toggleItem(item.id)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={checked}
                            disabled={disabled}
                            onClick={(event) => event.stopPropagation()}
                            onCheckedChange={() => toggleItem(item.id)}
                            aria-label={`Pilih ${item.name}`}
                          />
                        </TableCell>
                        <TableCell className="min-w-48 whitespace-normal">
                          <p className="font-medium">{item.name}</p>
                          {item.spec ? <p className="text-xs text-muted-foreground">{item.spec}</p> : null}
                          {item.billedQty > 0 ? (
                            <span className="mt-1 inline-block">
                              <Badge tone="neutral">
                                Sudah ditagih {formatNumber(item.billedQty)} {item.unit}
                              </Badge>
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {disabled ? (
                            "—"
                          ) : checked ? (
                            <Input
                              type="number"
                              min={0.01}
                              max={item.remainingQty}
                              step="any"
                              value={qty}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                setQtyById((current) => ({
                                  ...current,
                                  [item.id]: Math.min(Math.max(value, 0), item.remainingQty),
                                }));
                              }}
                              className="w-24"
                            />
                          ) : (
                            `${formatNumber(item.remainingQty)} ${item.unit}`
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            dari {formatNumber(item.orderedQty)} {item.unit}
                          </p>
                        </TableCell>
                        <TableCell>{formatRupiah(item.netPrice)}</TableCell>
                        {order.hasNgs ? (
                          <TableCell>{item.ngsPrice != null ? formatRupiah(item.ngsPrice) : "—"}</TableCell>
                        ) : null}
                        <TableCell className="font-medium">{formatRupiah(price)}</TableCell>
                        <TableCell className="text-right">{checked ? formatRupiah(amount) : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <p className="px-5 py-8 text-sm text-muted-foreground">
            Pilih order dulu. Item yang siap ditagih akan tampil di sini.
          </p>
        </Card>
      )}

      {order ? (
        <>
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Tanggal invoice">
              <Input id="invoice-date" type="date" defaultValue={todayIso()} />
            </Field>
            <Field label="Jatuh tempo">
              <Input id="invoice-due" type="date" defaultValue={addDays(todayIso(), 14)} />
            </Field>
            <Field label="Diskon (Rp)">
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(event) => setDiscount(Number(event.target.value))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includePpn} onChange={(event) => setIncludePpn(event.target.checked)} />
              Sertakan PPN
            </label>
            <Field label="Tarif PPN">
              <Select value={String(ppnRate)} onChange={(event) => setPpnRate(Number(event.target.value))}>
                <option value="0">0%</option>
                <option value="0.11">11%</option>
                <option value="0.12">12%</option>
              </Select>
            </Field>
            <Field label="Rekening pembayaran" hint="Muncul di invoice dan faktur.">
              <Select value={bankId} onChange={(event) => setBankId(event.target.value)}>
                <option value="">Pilih rekening</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName} · {bank.accountNumber} a.n. {bank.holder}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Catatan invoice">
                <Textarea
                  id="invoice-notes"
                  defaultValue={order.notes}
                  key={order.id}
                  placeholder="Rekening, syarat pembayaran, nomor PO..."
                />
              </Field>
            </div>
          </Card>
          <InvoiceTotals preview={preview} discount={discount} />
        </>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={pending || !order} onClick={() => submit(false)}>
          {pending ? "Menyimpan..." : "Simpan draft"}
        </Button>
        <Button type="button" disabled={pending || !order} onClick={() => submit(true)}>
          Terbitkan invoice
        </Button>
        <p className="text-xs text-muted-foreground">
          Faktur penjualan dan berita acara dibuat otomatis saat invoice diterbitkan.
        </p>
      </div>
    </div>
  );
}

function InvoiceDraftForm({
  customers,
  products,
  prices,
  banks,
  invoice,
  defaultPpnRate,
}: {
  customers: Customer[];
  products: Product[];
  prices: CustomerPrice[];
  banks: BankAccount[];
  invoice: Invoice;
  defaultPpnRate: number;
}) {
  const [customerId, setCustomerId] = useState(invoice.customerId || customers[0]?.id || "");
  const [bankId, setBankId] = useState(invoice.bankId || banks.find((bank) => bank.isDefault)?.id || banks[0]?.id || "");
  const [includePpn, setIncludePpn] = useState(invoice.includePpn);
  const [ppnRate, setPpnRate] = useState(invoice.ppnRate ?? defaultPpnRate);
  const [discount, setDiscount] = useState(invoice.discount || 0);
  const [items, setItems] = useState<DraftLine[]>(
    invoice.items.map((item) => ({
      key: item.id,
      productId: item.productId || "",
      name: item.name,
      spec: item.spec,
      qty: item.qty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      sourceItemId: item.sourceItemId,
    })) || [emptyLine()],
  );
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const preview = useMemo(() => {
    const fake = {
      items: items.map((item) => ({
        id: item.key,
        productId: item.productId || null,
        name: item.name,
        spec: item.spec,
        qty: item.qty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
      })),
      discount,
      includePpn,
      ppnRate,
    };
    const subtotal = invoiceSubtotal(fake.items);
    const dpp = invoiceDpp(fake);
    const ppn = invoicePpn(fake);
    return { subtotal, dpp, ppn, total: dpp + ppn };
  }, [discount, includePpn, items, ppnRate]);

  function submit(issue: boolean) {
    const payload = {
      customerId,
      date: (document.getElementById("invoice-date") as HTMLInputElement)?.value || todayIso(),
      dueDate: (document.getElementById("invoice-due") as HTMLInputElement)?.value || "",
      notes: (document.getElementById("invoice-notes") as HTMLTextAreaElement)?.value || "",
      discount,
      includePpn,
      ppnRate,
      bankId: bankId || null,
      items,
    };
    setError("");
    start(async () => {
      const result = await updateInvoice(invoice.id, payload);
      if (result?.error) setError(result.error);
      if (issue && !result?.error) await issueInvoice(invoice.id);
    });
  }

  return (
    <div className="grid gap-5">
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Ditagihkan kepada">
          <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">Pilih perusahaan</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tanggal invoice">
          <Input id="invoice-date" type="date" defaultValue={invoice.date || todayIso()} />
        </Field>
        <Field label="Jatuh tempo">
          <Input id="invoice-due" type="date" defaultValue={invoice.dueDate || addDays(todayIso(), 14)} />
        </Field>
        <Field label="Diskon (Rp)">
          <Input type="number" min={0} value={discount} onChange={(event) => setDiscount(Number(event.target.value))} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includePpn} onChange={(event) => setIncludePpn(event.target.checked)} />
          Sertakan PPN
        </label>
        <Field label="Tarif PPN">
          <Select value={String(ppnRate)} onChange={(event) => setPpnRate(Number(event.target.value))}>
            <option value="0">0%</option>
            <option value="0.11">11%</option>
            <option value="0.12">12%</option>
          </Select>
        </Field>
        <Field label="Rekening pembayaran" hint="Muncul di invoice dan faktur.">
          <Select value={bankId} onChange={(event) => setBankId(event.target.value)}>
            <option value="">Pilih rekening</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {bank.bankName} · {bank.accountNumber} a.n. {bank.holder}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Catatan invoice">
            <Textarea id="invoice-notes" defaultValue={invoice.notes} placeholder="Rekening, syarat pembayaran, nomor PO..." />
          </Field>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-heading text-xl">Rincian invoice</h2>
        <LineItemsEditor
          products={products}
          prices={prices}
          customerId={customerId}
          items={items}
          onChange={setItems}
        />
      </Card>
      <InvoiceTotals preview={preview} discount={discount} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => submit(false)}>
          {pending ? "Menyimpan..." : "Simpan draft"}
        </Button>
        <Button type="button" disabled={pending} onClick={() => submit(true)}>
          Terbitkan invoice
        </Button>
      </div>
    </div>
  );
}

function InvoiceTotals({
  preview,
  discount,
}: {
  preview: { subtotal: number; dpp: number; ppn: number; total: number };
  discount: number;
}) {
  return (
    <Card className="ml-auto w-full max-w-sm p-5">
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatRupiah(preview.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Diskon</dt>
          <dd>{formatRupiah(discount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">DPP</dt>
          <dd>{formatRupiah(preview.dpp)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">PPN</dt>
          <dd>{formatRupiah(preview.ppn)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <dt>Total</dt>
          <dd>{formatRupiah(preview.total)}</dd>
        </div>
      </dl>
    </Card>
  );
}
