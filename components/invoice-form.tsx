"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createInvoice, issueInvoice, updateInvoice } from "@/app/actions";
import { LineItemsEditor } from "@/components/line-items";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/form-controls";
import { addDays, formatRupiah, todayIso } from "@/lib/format";
import { invoiceDpp, invoicePpn, invoiceSubtotal } from "@/lib/finance";
import { resolveUnitPrice } from "@/lib/pricing";
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
  defaultCustomerId,
  defaultOrderId,
  defaultItems,
  defaultPpnRate,
}: {
  customers: Customer[];
  products: Product[];
  prices: CustomerPrice[];
  banks: BankAccount[];
  invoice?: Invoice;
  defaultCustomerId?: string;
  defaultOrderId?: string | null;
  defaultItems?: DraftLine[];
  defaultPpnRate: number;
}) {
  const [customerId, setCustomerId] = useState(
    invoice?.customerId || defaultCustomerId || customers[0]?.id || "",
  );
  const [bankId, setBankId] = useState(
    invoice?.bankId || banks.find((bank) => bank.isDefault)?.id || banks[0]?.id || "",
  );
  const [includePpn, setIncludePpn] = useState(invoice?.includePpn ?? true);
  const [ppnRate, setPpnRate] = useState(invoice?.ppnRate ?? defaultPpnRate);
  const [discount, setDiscount] = useState(invoice?.discount || 0);
  const [items, setItems] = useState<DraftLine[]>(
    invoice?.items.map((item) => ({
      key: item.id,
      productId: item.productId || "",
      name: item.name,
      spec: item.spec,
      qty: item.qty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
    })) ||
      defaultItems || [emptyLine()],
  );
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!customerId || invoice) return;
    setItems((current) =>
      current.map((item) => {
        const product = products.find((row) => row.id === item.productId);
        if (!product) return item;
        return {
          ...item,
          unitPrice: resolveUnitPrice(product, customerId, prices).price,
          costPrice: product.costPrice,
        };
      }),
    );
  }, [customerId, invoice, prices, products]);

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
      orderId: invoice?.orderId || defaultOrderId || null,
      date: (document.getElementById("invoice-date") as HTMLInputElement)?.value || todayIso(),
      dueDate: (document.getElementById("invoice-due") as HTMLInputElement)?.value || "",
      notes: (document.getElementById("invoice-notes") as HTMLTextAreaElement)?.value || "",
      discount,
      includePpn,
      ppnRate,
      bankId: bankId || null,
      items,
      issue,
    };
    setError("");
    start(async () => {
      const result = invoice
        ? await updateInvoice(invoice.id, payload)
        : await createInvoice(payload);
      if (result?.error) setError(result.error);
      if (invoice && issue && !result?.error) await issueInvoice(invoice.id);
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
          <Input id="invoice-date" type="date" defaultValue={invoice?.date || todayIso()} />
        </Field>
        <Field label="Jatuh tempo">
          <Input id="invoice-due" type="date" defaultValue={invoice?.dueDate || addDays(todayIso(), 14)} />
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
            <Textarea id="invoice-notes" defaultValue={invoice?.notes} placeholder="Rekening, syarat pembayaran, nomor PO..." />
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
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => submit(false)}>
          {pending ? "Menyimpan..." : "Simpan draft"}
        </Button>
        <Button type="button" disabled={pending} onClick={() => submit(true)}>
          Terbitkan invoice
        </Button>
        <p className="text-xs text-muted-foreground">Faktur penjualan dan berita acara dibuat otomatis saat invoice diterbitkan.</p>
      </div>
    </div>
  );
}
