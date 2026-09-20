"use client";

import { useMemo, useState, useTransition } from "react";
import { resolveUnitPrice } from "@/lib/pricing";
import { UNIT_OPTIONS } from "@/lib/labels";
import type { CustomerPrice, DraftLine, Product } from "@/lib/types";
import { Button, Input, Select } from "@/components/form-controls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatRupiah } from "@/lib/format";

export function LineItemsEditor({
  products,
  prices,
  customerId,
  items,
  onChange,
}: {
  products: Product[];
  prices: CustomerPrice[];
  customerId: string;
  items: DraftLine[];
  onChange: (items: DraftLine[]) => void;
}) {
  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product])),
    [products],
  );

  function update(key: string, patch: Partial<DraftLine>) {
    onChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function pickProduct(key: string, productId: string) {
    if (!productId) {
      update(key, { productId: "", name: "", unit: "pcs", unitPrice: 0, costPrice: 0 });
      return;
    }
    const product = productMap[productId];
    if (!product) return;
    const resolved = customerId
      ? resolveUnitPrice(product, customerId, prices)
      : { price: product.defaultPrice, source: "umum" as const };
    update(key, {
      productId,
      name: product.name,
      unit: product.unit,
      unitPrice: resolved.price,
      costPrice: product.costPrice,
    });
  }

  return (
    <div className="grid gap-3">
      <div className="hidden grid-cols-12 gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
        <span className="col-span-4">Item</span>
        <span className="col-span-3">Spesifikasi</span>
        <span className="col-span-1">Qty</span>
        <span className="col-span-1">Sat</span>
        <span className="col-span-2">Harga</span>
        <span className="col-span-1 text-right">Jumlah</span>
      </div>
      {items.map((item) => {
        const product = item.productId ? productMap[item.productId] : undefined;
        const source = product && customerId ? resolveUnitPrice(product, customerId, prices).source : null;
        const amount = Math.round((item.qty || 0) * (item.unitPrice || 0));
        return (
          <div key={item.key} className="grid gap-2 rounded-2xl border border-border bg-white p-3 md:grid-cols-12 md:items-start">
            <div className="md:col-span-4 grid gap-2">
              <Select value={item.productId} onChange={(event) => pickProduct(item.key, event.target.value)}>
                <option value="">Item kustom / pekerjaan</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
              <Input
                value={item.name}
                placeholder="Nama item atau pekerjaan"
                onChange={(event) => update(item.key, { name: event.target.value })}
              />
              {source ? (
                <p className="text-[11px] text-muted-foreground">
                  {source === "khusus" ? "Harga khusus perusahaan ini" : "Harga umum katalog"}
                </p>
              ) : null}
            </div>
            <Input
              className="md:col-span-3"
              value={item.spec}
              placeholder="Ukuran, bahan, finishing"
              onChange={(event) => update(item.key, { spec: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2 md:contents">
              <label className="grid gap-1 md:col-span-1">
                <span className="text-xs text-muted-foreground md:hidden">Qty</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.qty}
                  onChange={(event) => update(item.key, { qty: Number(event.target.value) })}
                />
              </label>
              <label className="grid gap-1 md:col-span-1">
                <span className="text-xs text-muted-foreground md:hidden">Satuan</span>
                <Select
                  value={item.unit}
                  onChange={(event) => update(item.key, { unit: event.target.value })}
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </Select>
              </label>
            </div>
            <label className="grid gap-1 md:col-span-2">
              <span className="text-xs text-muted-foreground md:hidden">Harga</span>
              <Input
                type="number"
                min={0}
                value={item.unitPrice}
                onChange={(event) => update(item.key, { unitPrice: Number(event.target.value) })}
              />
            </label>
            <div className="flex items-center justify-between gap-2 md:col-span-1 md:block md:pt-0 md:text-right">
              <span className="text-sm font-medium">{formatRupiah(amount)}</span>
              <button
                type="button"
                className="text-xs text-destructive"
                onClick={() => onChange(items.filter((row) => row.key !== item.key))}
              >
                Hapus
              </button>
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([
            ...items,
            {
              key: crypto.randomUUID(),
              productId: "",
              name: "",
              spec: "",
              qty: 1,
              unit: "pcs",
              unitPrice: 0,
              costPrice: 0,
            },
          ])
        }
      >
        Tambah item
      </Button>
    </div>
  );
}

export function ConfirmSubmit({
  label,
  message,
  action,
  variant = "danger",
}: {
  label: string;
  message: string;
  action: () => Promise<unknown>;
  variant?: "danger" | "outline";
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Button type="button" variant={variant} size="sm" disabled={pending} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi</AlertDialogTitle>
            <AlertDialogDescription>{message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={variant === "danger" ? "destructive" : "default"}
              onClick={(event) => {
                event.preventDefault();
                start(async () => {
                  await action();
                  setOpen(false);
                });
              }}
            >
              {pending ? "Memproses..." : "Ya, lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function StatusButtons({
  current,
  options,
  action,
}: {
  current: string;
  options: { value: string; label: string }[];
  action: (value: string) => Promise<unknown>;
}) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(current);
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Select
        className="w-full sm:w-52"
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          start(async () => {
            await action(next);
          });
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
