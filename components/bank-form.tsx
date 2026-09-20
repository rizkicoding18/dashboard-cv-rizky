"use client";

import { useState, useTransition } from "react";
import { createBank, updateBank } from "@/app/actions";
import { Button, Card, Field, Input, Textarea } from "@/components/form-controls";
import type { BankAccount } from "@/lib/types";

export function BankForm({ bank }: { bank?: BankAccount }) {
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
            bankName: String(data.get("bankName") || ""),
            accountNumber: String(data.get("accountNumber") || ""),
            holder: String(data.get("holder") || ""),
            isDefault: data.get("isDefault") === "on",
            notes: String(data.get("notes") || ""),
          };
          setError("");
          setSaved(false);
          start(async () => {
            const result = bank ? await updateBank(bank.id, payload) : await createBank(payload);
            if (result?.error) setError(result.error);
            else setSaved(true);
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama bank">
            <Input name="bankName" required defaultValue={bank?.bankName} placeholder="BCA, Mandiri, BRI..." />
          </Field>
          <Field label="Nomor rekening">
            <Input name="accountNumber" required defaultValue={bank?.accountNumber} />
          </Field>
          <Field label="Atas nama">
            <Input name="holder" defaultValue={bank?.holder} placeholder="CV Rizky" />
          </Field>
          <label className="flex items-center gap-2 self-end text-sm">
            <input type="checkbox" name="isDefault" defaultChecked={Boolean(bank?.isDefault)} />
            Jadikan rekening default
          </label>
        </div>
        <Field label="Catatan">
          <Textarea name="notes" defaultValue={bank?.notes} placeholder="Cabang, keperluan rekening, dsb." />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {saved ? <p className="text-sm text-ok">Tersimpan.</p> : null}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : bank ? "Simpan rekening" : "Tambah rekening"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
