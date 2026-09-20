"use client";

import { useMemo, useState, useTransition } from "react";
import { createQuotation, updateQuotation } from "@/app/actions";
import { LineItemsEditor } from "@/components/line-items";
import { Button, Card, Field, Input, Textarea, Select } from "@/components/form-controls";
import { addDays, formatRupiah, todayIso } from "@/lib/format";
import { invoiceDpp, invoicePpn, invoiceSubtotal } from "@/lib/finance";
import { QUOTATION_KIND_LABEL } from "@/lib/quotations";
import type { Customer, CustomerPrice, DraftLine, Product, Quotation, QuotationKind } from "@/lib/types";

export function QuotationForm({
  kind,
  customers,
  products,
  prices,
  quotation,
  defaultCustomerId,
  defaultOrderId,
  defaultSourceId,
  defaultItems,
  defaultSubject,
  defaultIntro,
  defaultPpnRate,
}: {
  kind: QuotationKind;
  customers: Customer[];
  products: Product[];
  prices: CustomerPrice[];
  quotation?: Quotation;
  defaultCustomerId: string;
  defaultOrderId: string;
  defaultSourceId?: string | null;
  defaultItems?: DraftLine[];
  defaultSubject: string;
  defaultIntro: string;
  defaultPpnRate: number;
}) {
  const customerId = quotation?.customerId || defaultCustomerId;
  const [includePpn, setIncludePpn] = useState(quotation?.includePpn ?? true);
  const [ppnRate, setPpnRate] = useState(quotation?.ppnRate ?? defaultPpnRate);
  const [discount, setDiscount] = useState(quotation?.discount || 0);
  const [items, setItems] = useState<DraftLine[]>(
    quotation?.items.map((item) => ({
      key: item.id,
      productId: item.productId || "",
      name: item.name,
      spec: item.spec,
      qty: item.qty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
    })) ||
      defaultItems ||
      [],
  );
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const customerName = customers.find((customer) => customer.id === customerId)?.name || "";

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

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const payload = {
          kind: quotation?.kind || kind,
          orderId: quotation?.orderId || defaultOrderId,
          customerId,
          sourceId: quotation?.sourceId || defaultSourceId || null,
          date: String(data.get("date") || todayIso()),
          validUntil: String(data.get("validUntil") || ""),
          subject: String(data.get("subject") || ""),
          intro: String(data.get("intro") || ""),
          terms: "",
          notes: String(data.get("notes") || ""),
          discount,
          includePpn,
          ppnRate,
          bankId: null,
          items,
        };
        setError("");
        start(async () => {
          const result = quotation
            ? await updateQuotation(quotation.id, payload)
            : await createQuotation(payload);
          if (result?.error) setError(result.error);
        });
      }}
    >
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Perusahaan tujuan">
          <Input readOnly value={customerName} />
        </Field>
        <Field label="Jenis">
          <Input readOnly value={QUOTATION_KIND_LABEL[quotation?.kind || kind]} />
        </Field>
        <Field label="Tanggal surat">
          <Input name="date" type="date" defaultValue={quotation?.date || todayIso()} />
        </Field>
        <Field label="Berlaku sampai">
          <Input
            name="validUntil"
            type="date"
            defaultValue={quotation?.validUntil || addDays(todayIso(), 14)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Perihal">
            <Input name="subject" defaultValue={quotation?.subject || defaultSubject} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Kalimat pembuka">
            <Textarea name="intro" rows={4} defaultValue={quotation?.intro || defaultIntro} />
          </Field>
        </div>
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
        <div className="sm:col-span-2">
          <Field label="Catatan">
            <Textarea name="notes" defaultValue={quotation?.notes} placeholder="Catatan yang tampil dekat terbilang" />
          </Field>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-heading text-xl">Rincian harga</h2>
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
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : quotation ? "Simpan perubahan" : `Buat ${QUOTATION_KIND_LABEL[kind].toLowerCase()}`}
      </Button>
    </form>
  );
}
