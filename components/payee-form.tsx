"use client";

import { useState, useTransition } from "react";
import { createPayee, updatePayee } from "@/app/actions";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/form-controls";
import { PAYEE_KIND_LABEL } from "@/lib/payroll";
import type { Payee, PayeeKind } from "@/lib/types";

export function PayeeForm({ payee }: { payee?: Payee }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const payload = {
          kind: String(data.get("kind") || "pekerja") as PayeeKind,
          name: String(data.get("name") || ""),
          phone: String(data.get("phone") || ""),
          notes: String(data.get("notes") || ""),
        };
        setError("");
        start(async () => {
          const result = payee ? await updatePayee(payee.id, payload) : await createPayee(payload);
          if (result?.error) setError(result.error);
        });
      }}
    >
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Jenis">
          <Select name="kind" defaultValue={payee?.kind || "pekerja"}>
            {Object.entries(PAYEE_KIND_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nama">
          <Input name="name" required defaultValue={payee?.name} placeholder="Nama orang atau perusahaan luar" />
        </Field>
        <Field label="Telepon">
          <Input name="phone" defaultValue={payee?.phone} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Catatan" hint="Pekerja upah borongan, atau vendor yang mengirim nota desain/cetak.">
            <Textarea name="notes" defaultValue={payee?.notes} />
          </Field>
        </div>
      </Card>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : payee ? "Simpan penerima" : "Tambah penerima"}
      </Button>
    </form>
  );
}
