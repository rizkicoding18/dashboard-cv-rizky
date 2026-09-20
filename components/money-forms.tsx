"use client";

import { useState, useTransition } from "react";
import {
  addPayment,
  createExpense,
  createPurchase,
  upsertCustomerPrice,
  updateProfile,
  resetDemoData,
} from "@/app/actions";
import { Button, Card, Field, Input, Select } from "@/components/form-controls";
import { formatBankOption } from "@/lib/banks";
import { todayIso } from "@/lib/format";
import { uploadAccept } from "@/lib/file-meta";
import { EXPENSE_LABEL } from "@/lib/labels";
import type { BankAccount, CompanyProfile, Customer, ExpenseCategory, Product } from "@/lib/types";

export function PriceForm({
  customers,
  productId,
}: {
  customers: Customer[];
  productId: string;
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-3 sm:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setError("");
        start(async () => {
          const result = await upsertCustomerPrice({
            customerId: String(data.get("customerId") || ""),
            productId,
            unitPrice: Number(data.get("unitPrice") || 0),
            notes: String(data.get("notes") || ""),
          });
          if (result?.error) setError(result.error);
          else form.reset();
        });
      }}
    >
      <Select name="customerId" required>
        <option value="">Pilih perusahaan</option>
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </Select>
      <Input name="unitPrice" type="number" min={0} placeholder="Harga khusus" required />
      <Input name="notes" placeholder="Catatan kontrak" />
      <Button type="submit" disabled={pending}>
        {pending ? "..." : "Simpan harga"}
      </Button>
      {error ? <p className="sm:col-span-4 text-sm text-destructive">{error}</p> : null}
    </form>
  );
}

export function PurchaseForm({ products }: { products: Product[] }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-heading text-xl">Stok masuk / pembelian</h2>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          setError("");
          start(async () => {
            const result = await createPurchase({
              date: String(data.get("date") || todayIso()),
              supplier: String(data.get("supplier") || ""),
              paid: data.get("paid") === "on",
              notes: String(data.get("notes") || ""),
              productId: String(data.get("productId") || ""),
              qty: Number(data.get("qty") || 0),
              unitCost: Number(data.get("unitCost") || 0),
            });
            if (result?.error) setError(result.error);
            else form.reset();
          });
        }}
      >
        <Field label="Barang">
          <Select name="productId" required>
            <option value="">Pilih barang</option>
            {products
              .filter((product) => product.trackStock)
              .map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Supplier">
          <Input name="supplier" placeholder="Nama pemasok" />
        </Field>
        <Field label="Tanggal">
          <Input name="date" type="date" defaultValue={todayIso()} />
        </Field>
        <Field label="Jumlah">
          <Input name="qty" type="number" min={0} step="0.01" required />
        </Field>
        <Field label="Harga modal / unit">
          <Input name="unitCost" type="number" min={0} required />
        </Field>
        <label className="flex items-center gap-2 self-end text-sm">
          <input type="checkbox" name="paid" defaultChecked />
          Sudah dibayar (kas keluar)
        </label>
        <div className="sm:col-span-2">
          <Field label="Catatan">
            <Input name="notes" />
          </Field>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Catat pembelian"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function ExpenseForm() {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-heading text-xl">Catat biaya harian</h2>
      <p className="mb-4 -mt-2 text-sm text-muted-foreground">Sewa, listrik, bensin, dan pengeluaran operasional lain.</p>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          setError("");
          start(async () => {
            const result = await createExpense({
              date: String(data.get("date") || todayIso()),
              category: String(data.get("category") || "operasional") as ExpenseCategory,
              description: String(data.get("description") || ""),
              amount: Number(data.get("amount") || 0),
            });
            if (result?.error) setError(result.error);
            else form.reset();
          });
        }}
      >
        <Field label="Tanggal">
          <Input name="date" type="date" defaultValue={todayIso()} />
        </Field>
        <Field label="Kategori">
          <Select name="category" defaultValue="operasional">
            {Object.entries(EXPENSE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Uraian">
          <Input name="description" required />
        </Field>
        <Field label="Nominal">
          <Input name="amount" type="number" min={0} required />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Catat beban"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function PaymentForm({
  invoiceId,
  banks,
  defaultBankId,
}: {
  invoiceId: string;
  banks: BankAccount[];
  defaultBankId?: string | null;
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const fallbackBankId = defaultBankId || banks.find((bank) => bank.isDefault)?.id || banks[0]?.id || "";

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setError("");
        start(async () => {
          const result = await addPayment(invoiceId, data);
          if (result?.error) setError(result.error);
          else form.reset();
        });
      }}
    >
      <Field label="Tanggal bayar">
        <Input name="date" type="date" defaultValue={todayIso()} />
      </Field>
      <Field label="Nominal">
        <Input name="amount" type="number" min={0} required />
      </Field>
      <Field label="Metode">
        <Select name="method" defaultValue="transfer">
          <option value="transfer">Transfer</option>
          <option value="tunai">Tunai</option>
          <option value="giro">Giro</option>
        </Select>
      </Field>
      <Field label="Bank penerima" hint="Rekening dari master data Bank.">
        <Select name="bankId" defaultValue={fallbackBankId} required>
          <option value="">Pilih rekening</option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {formatBankOption(bank)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Bukti pembayaran" hint="Opsional. PDF, JPG, PNG, atau WEBP. Maksimal 12 MB.">
          <Input name="file" type="file" accept={uploadAccept("proof")} />
        </Field>
      </div>
      <Field label="Catatan">
        <Input name="notes" />
      </Field>
      {error ? <p className="sm:col-span-2 text-sm text-destructive">{error}</p> : null}
      {banks.length === 0 ? (
        <p className="sm:col-span-2 text-sm text-destructive">Tambah rekening di menu Bank sebelum mencatat pembayaran.</p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending || banks.length === 0}>
          {pending ? "Menyimpan..." : "Catat pembayaran"}
        </Button>
      </div>
    </form>
  );
}

export function SettingsForm({ profile }: { profile: CompanyProfile }) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Card className="p-5">
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setError("");
          setSaved(false);
          start(async () => {
            const result = await updateProfile({
              name: String(data.get("name") || ""),
              tagline: String(data.get("tagline") || ""),
              owner: String(data.get("owner") || ""),
              ownerTitle: String(data.get("ownerTitle") || ""),
              address: String(data.get("address") || ""),
              city: String(data.get("city") || ""),
              phone: String(data.get("phone") || ""),
              email: String(data.get("email") || ""),
              npwp: String(data.get("npwp") || ""),
              defaultPpnRate: Number(data.get("defaultPpnRate") || 0),
              openingCash: Number(data.get("openingCash") || 0),
              openingCapital: Number(data.get("openingCapital") || 0),
            });
            if (result?.error) setError(result.error);
            else setSaved(true);
          });
        }}
      >
        <Field label="Nama usaha">
          <Input name="name" defaultValue={profile.name} required />
        </Field>
        <Field label="Tagline">
          <Input name="tagline" defaultValue={profile.tagline} />
        </Field>
        <Field label="Pemilik / penandatangan">
          <Input name="owner" defaultValue={profile.owner} />
        </Field>
        <Field label="Jabatan">
          <Input name="ownerTitle" defaultValue={profile.ownerTitle} />
        </Field>
        <Field label="Alamat">
          <Input name="address" defaultValue={profile.address} />
        </Field>
        <Field label="Kota">
          <Input name="city" defaultValue={profile.city} />
        </Field>
        <Field label="Telepon">
          <Input name="phone" defaultValue={profile.phone} />
        </Field>
        <Field label="Email">
          <Input name="email" defaultValue={profile.email} />
        </Field>
        <Field label="NPWP">
          <Input name="npwp" defaultValue={profile.npwp} />
        </Field>
        <Field label="PPN default">
          <Select name="defaultPpnRate" defaultValue={String(profile.defaultPpnRate)}>
            <option value="0">0%</option>
            <option value="0.11">11%</option>
            <option value="0.12">12%</option>
          </Select>
        </Field>
        <Field label="Kas awal">
          <Input name="openingCash" type="number" defaultValue={profile.openingCash} />
        </Field>
        <Field label="Modal awal">
          <Input name="openingCapital" type="number" defaultValue={profile.openingCapital} />
        </Field>
        {error ? <p className="sm:col-span-2 text-sm text-destructive">{error}</p> : null}
        {saved ? <p className="sm:col-span-2 text-sm text-ok">Pengaturan tersimpan.</p> : null}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan pengaturan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function ResetDemoButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!confirm("Data saat ini akan diganti data contoh. Lanjutkan?")) return;
        start(async () => {
          await resetDemoData();
        });
      }}
    >
      {pending ? "Mengembalikan..." : "Kembalikan data contoh"}
    </Button>
  );
}
