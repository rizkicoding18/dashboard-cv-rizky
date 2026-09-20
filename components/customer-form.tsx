"use client";

import { useState, useTransition } from "react";
import { createCustomer, updateCustomer } from "@/app/actions";
import { Button, Card, Field, Input, Textarea } from "@/components/form-controls";
import type { Customer } from "@/lib/types";

export function CustomerForm({ customer }: { customer?: Customer }) {
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
            name: String(data.get("name") || ""),
            pic: String(data.get("pic") || ""),
            phone: String(data.get("phone") || ""),
            email: String(data.get("email") || ""),
            address: String(data.get("address") || ""),
            notes: String(data.get("notes") || ""),
          };
          setError("");
          setSaved(false);
          start(async () => {
            const result = customer
              ? await updateCustomer(customer.id, payload)
              : await createCustomer(payload);
            if (result?.error) setError(result.error);
            else setSaved(true);
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama perusahaan">
            <Input name="name" required defaultValue={customer?.name} placeholder="PT / CV / Dinas" />
          </Field>
          <Field label="PIC / penanggung jawab">
            <Input name="pic" defaultValue={customer?.pic} />
          </Field>
          <Field label="Telepon">
            <Input name="phone" defaultValue={customer?.phone} />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={customer?.email} />
          </Field>
        </div>
        <Field label="Alamat">
          <Textarea name="address" defaultValue={customer?.address} />
        </Field>
        <Field label="Catatan" hint="Termasuk catatan kontrak atau kesepakatan harga.">
          <Textarea name="notes" defaultValue={customer?.notes} />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {saved ? <p className="text-sm text-ok">Tersimpan.</p> : null}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : customer ? "Simpan perubahan" : "Simpan perusahaan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
