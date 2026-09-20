"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createOrder, updateOrder } from "@/app/actions";
import { LineItemsEditor } from "@/components/line-items";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/form-controls";
import { addDays, todayIso } from "@/lib/format";
import { resolveUnitPrice } from "@/lib/pricing";
import type { Customer, CustomerPrice, DraftLine, Order, Product } from "@/lib/types";

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

export function OrderForm({
  customers,
  products,
  prices,
  order,
  defaultCustomerId,
}: {
  customers: Customer[];
  products: Product[];
  prices: CustomerPrice[];
  order?: Order;
  defaultCustomerId?: string;
}) {
  const [customerId, setCustomerId] = useState(
    order?.customerId || defaultCustomerId || customers[0]?.id || "",
  );
  const [items, setItems] = useState<DraftLine[]>(
    order?.items.map((item) => ({
      key: item.id,
      productId: item.productId || "",
      name: item.name,
      spec: item.spec,
      qty: item.qty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
    })) || [emptyLine()],
  );
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const skipPriceSync = useRef(true);

  useEffect(() => {
    if (!customerId) return;
    if (skipPriceSync.current) {
      skipPriceSync.current = false;
      return;
    }
    setItems((current) =>
      current.map((item) => {
        const product = products.find((row) => row.id === item.productId);
        if (!product) return item;
        const resolved = resolveUnitPrice(product, customerId, prices);
        return { ...item, unitPrice: resolved.price, costPrice: product.costPrice };
      }),
    );
  }, [customerId, prices, products]);

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const payload = {
          customerId,
          date: String(data.get("date") || todayIso()),
          dueDate: String(data.get("dueDate") || ""),
          notes: String(data.get("notes") || ""),
          items,
        };
        setError("");
        start(async () => {
          const result = order ? await updateOrder(order.id, payload) : await createOrder(payload);
          if (result?.error) setError(result.error);
        });
      }}
    >
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Perusahaan pemesan">
          <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <option value="">Pilih perusahaan</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tanggal order">
          <Input name="date" type="date" defaultValue={order?.date || todayIso()} />
        </Field>
        <Field label="Deadline">
          <Input name="dueDate" type="date" defaultValue={order?.dueDate || addDays(todayIso(), 7)} />
        </Field>
        <Field label="Catatan produksi">
          <Textarea name="notes" defaultValue={order?.notes} placeholder="Finishing, file desain, pengiriman..." />
        </Field>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-heading text-xl">Item order</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Harga terisi otomatis dari harga khusus perusahaan, atau harga umum jika belum ada kesepakatan.
        </p>
        <LineItemsEditor
          products={products}
          prices={prices}
          customerId={customerId}
          items={items}
          onChange={setItems}
        />
      </Card>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : order ? "Simpan order" : "Buat order"}
        </Button>
      </div>
    </form>
  );
}
