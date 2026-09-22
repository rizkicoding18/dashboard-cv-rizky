"use client";

import { useState, useTransition } from "react";
import { createReceipt } from "@/app/actions";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/form-controls";
import { formatBankOption } from "@/lib/banks";
import { formatRupiah, parseGroupedNumber } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/labels";
import type { BankAccount, PaymentMethod } from "@/lib/types";

export function KwitansiForm({
  invoiceId,
  invoiceNumber,
  customerName,
  invoiceTotal,
  paymentId,
  defaultDate,
  defaultAmount,
  defaultMethod,
  defaultBankId,
  defaultDescription,
  defaultNotes,
  banks,
}: {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  invoiceTotal: number;
  paymentId: string | null;
  defaultDate: string;
  defaultAmount: number;
  defaultMethod: PaymentMethod;
  defaultBankId: string | null;
  defaultDescription: string;
  defaultNotes: string;
  banks: BankAccount[];
}) {
  const [method, setMethod] = useState<PaymentMethod>(defaultMethod);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const fallbackBankId = defaultBankId || banks.find((bank) => bank.isDefault)?.id || banks[0]?.id || "";

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError("");
        start(async () => {
          const result = await createReceipt({
            invoiceId,
            paymentId,
            date: String(data.get("date") || defaultDate),
            amount: parseGroupedNumber(String(data.get("amount") || "")),
            method,
            bankId: String(data.get("bankId") || "") || null,
            description: String(data.get("description") || ""),
            notes: String(data.get("notes") || ""),
          });
          if (result?.error) setError(result.error);
        });
      }}
    >
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <p className="font-medium">{customerName}</p>
          <p className="mt-1 text-muted-foreground">
            Invoice {invoiceNumber} · nilai {formatRupiah(invoiceTotal)}
          </p>
        </div>
        <Field label="Tanggal">
          <Input name="date" type="date" defaultValue={defaultDate} required />
        </Field>
        <Field label="Nominal" hint={`Maksimal ${formatRupiah(invoiceTotal)}`}>
          <Input name="amount" type="number" min={1} step="1" defaultValue={defaultAmount} required />
        </Field>
        <Field label="Cara bayar">
          <Select
            name="method"
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
          >
            {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((value) => (
              <option key={value} value={value}>
                {PAYMENT_METHOD_LABEL[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Bank penerima"
          hint={method === "tunai" ? "Opsional untuk tunai." : "Rekening dari master data Bank."}
        >
          <Select name="bankId" defaultValue={fallbackBankId} required={method !== "tunai"}>
            <option value="">{method === "tunai" ? "Tidak memakai rekening" : "Pilih rekening"}</option>
            {banks.map((bank) => (
              <option key={bank.id} value={bank.id}>
                {formatBankOption(bank)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Untuk pembayaran">
            <Textarea name="description" defaultValue={defaultDescription} rows={3} required />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Catatan">
            <Input name="notes" defaultValue={defaultNotes} />
          </Field>
        </div>
        {error ? <p className="sm:col-span-2 text-sm text-destructive">{error}</p> : null}
        {banks.length === 0 && method !== "tunai" ? (
          <p className="sm:col-span-2 text-sm text-destructive">
            Tambah rekening di menu Bank sebelum membuat kwitansi transfer.
          </p>
        ) : null}
        <div>
          <Button type="submit" disabled={pending || (banks.length === 0 && method !== "tunai")}>
            {pending ? "Menyimpan..." : "Buat kwitansi"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
