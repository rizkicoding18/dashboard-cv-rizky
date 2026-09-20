"use client";

import { useState, useTransition } from "react";
import { createProduct, updateProduct } from "@/app/actions";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/form-controls";
import { CATEGORY_LABEL, UNIT_OPTIONS } from "@/lib/labels";
import type { Product, ProductCategory } from "@/lib/types";

export function ProductForm({ product }: { product?: Product }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <Card className="p-5">
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const payload = {
            sku: String(data.get("sku") || ""),
            name: String(data.get("name") || ""),
            category: String(data.get("category") || "percetakan") as ProductCategory,
            unit: String(data.get("unit") || "pcs"),
            stock: Number(data.get("stock") || 0),
            minStock: Number(data.get("minStock") || 0),
            costPrice: Number(data.get("costPrice") || 0),
            defaultPrice: Number(data.get("defaultPrice") || 0),
            trackStock: data.get("trackStock") === "on",
            description: String(data.get("description") || ""),
          };
          setError("");
          setSaved(false);
          start(async () => {
            const result = product
              ? await updateProduct(product.id, payload)
              : await createProduct(payload);
            if (result?.error) setError(result.error);
            else setSaved(true);
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama barang / jasa">
            <Input name="name" required defaultValue={product?.name} />
          </Field>
          <Field label="SKU">
            <Input name="sku" defaultValue={product?.sku} placeholder="Otomatis jika kosong" />
          </Field>
          <Field label="Kategori">
            <Select name="category" defaultValue={product?.category || "percetakan"}>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Satuan">
            <Select name="unit" defaultValue={product?.unit || "pcs"}>
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </Select>
          </Field>
          {product ? null : (
            <Field label="Stok awal">
              <Input name="stock" type="number" min={0} defaultValue={0} />
            </Field>
          )}
          <Field label="Stok minimum">
            <Input name="minStock" type="number" min={0} defaultValue={product?.minStock || 0} />
          </Field>
          <Field label="Harga modal / HPP">
            <Input name="costPrice" type="number" min={0} defaultValue={product?.costPrice || 0} />
          </Field>
          <Field label="Harga jual umum" hint="Bisa ditimpa harga khusus per perusahaan.">
            <Input name="defaultPrice" type="number" min={0} defaultValue={product?.defaultPrice || 0} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="trackStock" defaultChecked={product?.trackStock ?? true} />
          Catat stok (matikan untuk jasa murni)
        </label>
        <Field label="Deskripsi">
          <Textarea name="description" defaultValue={product?.description} />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {saved ? <p className="text-sm text-ok">Tersimpan.</p> : null}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : product ? "Simpan perubahan" : "Simpan barang"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
