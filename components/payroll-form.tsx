"use client";

import { useMemo, useState, useTransition } from "react";
import { createPayroll, markPayrollPaid, updatePayroll } from "@/app/actions";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/form-controls";
import { formatRupiah, todayIso } from "@/lib/format";
import { PAYEE_KIND_LABEL, PAYROLL_UNITS, WORK_TYPE_LABEL, payrollItemAmount } from "@/lib/payroll";
import type { DraftPayrollLine, Order, Payee, Payroll, PaymentMethod, WorkType } from "@/lib/types";

function emptyLine(key: string): DraftPayrollLine {
  return {
    key,
    payeeId: "",
    workType: "cetak",
    description: "",
    qty: 1,
    unit: "pekerjaan",
    rate: 0,
  };
}

export function PayrollForm({
  payees,
  orders,
  payroll,
  defaultOrderId,
}: {
  payees: Payee[];
  orders: Order[];
  payroll?: Payroll;
  defaultOrderId?: string;
}) {
  const [items, setItems] = useState<DraftPayrollLine[]>(
    payroll?.items.map((item) => ({
      key: item.id,
      payeeId: item.payeeId,
      workType: item.workType,
      description: item.description,
      qty: item.qty,
      unit: item.unit,
      rate: item.rate,
    })) || [emptyLine("line-1")],
  );
  const [paid, setPaid] = useState(payroll?.status === "lunas");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const total = useMemo(
    () => items.reduce((sum, item) => sum + payrollItemAmount(item), 0),
    [items],
  );

  function update(key: string, patch: Partial<DraftPayrollLine>) {
    setItems((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function pickPayee(key: string, payeeId: string) {
    const payee = payees.find((row) => row.id === payeeId);
    update(key, {
      payeeId,
      unit: payee?.kind === "vendor" ? "nota" : "pekerjaan",
      workType: payee?.kind === "vendor" ? "cetak" : "finishing",
    });
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const payload = {
          date: String(data.get("date") || todayIso()),
          orderId: String(data.get("orderId") || "") || null,
          notes: String(data.get("notes") || ""),
          items,
        };
        setError("");
        start(async () => {
          const result = payroll
            ? await updatePayroll(payroll.id, payload)
            : await createPayroll({
                ...payload,
                paid,
                method: String(data.get("method") || "transfer") as PaymentMethod,
              });
          if (result?.error) setError(result.error);
        });
      }}
    >
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Tanggal">
          <Input name="date" type="date" defaultValue={payroll?.date || todayIso()} />
        </Field>
        <Field label="Order terkait" hint="Opsional. Pakai jika upah/nota untuk pekerjaan tertentu.">
          <Select name="orderId" defaultValue={payroll?.orderId || defaultOrderId || ""}>
            <option value="">Tidak terkait order</option>
            {orders
              .filter((order) => order.status !== "dibatalkan")
              .map((order) => (
                <option key={order.id} value={order.id}>
                  {order.number}
                </option>
              ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Catatan">
            <Textarea name="notes" defaultValue={payroll?.notes} placeholder="Ringkasan pekerjaan atau nomor nota" />
          </Field>
        </div>
        {payroll ? null : (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} />
              Sudah dibayar (kas keluar, masuk neraca sebagai beban lunas)
            </label>
            {paid ? (
              <Field label="Cara bayar">
                <Select name="method" defaultValue="transfer">
                  <option value="transfer">Transfer</option>
                  <option value="tunai">Tunai</option>
                </Select>
              </Field>
            ) : (
              <p className="self-center text-sm text-muted-foreground">Belum dibayar tercatat sebagai hutang gaji/vendor.</p>
            )}
          </>
        )}
      </Card>
      <Card className="p-5">
        <h2 className="mb-1 font-heading text-xl">Rincian upah & nota</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Jumlah orang dan volume pekerjaan menentukan total. Vendor luar memakai baris nota (desain, cetak, dan lain-lain).
        </p>
        <div className="grid gap-3">
          {items.map((item) => {
            const payee = payees.find((row) => row.id === item.payeeId);
            return (
              <div key={item.key} className="grid gap-2 rounded-2xl border border-border p-3 md:grid-cols-12">
                <div className="md:col-span-3">
                  <Select value={item.payeeId} onChange={(event) => pickPayee(item.key, event.target.value)}>
                    <option value="">Pilih penerima</option>
                    {payees.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name} · {PAYEE_KIND_LABEL[row.kind]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Select
                    value={item.workType}
                    onChange={(event) => update(item.key, { workType: event.target.value as WorkType })}
                  >
                    {Object.entries(WORK_TYPE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Input
                    value={item.description}
                    placeholder={payee?.kind === "vendor" ? "Nomor nota / uraian" : "Uraian pekerjaan"}
                    onChange={(event) => update(item.key, { description: event.target.value })}
                  />
                </div>
                <div className="md:col-span-1">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.qty}
                    onChange={(event) => update(item.key, { qty: Number(event.target.value) })}
                  />
                </div>
                <div className="md:col-span-1">
                  <Select value={item.unit} onChange={(event) => update(item.key, { unit: event.target.value })}>
                    {PAYROLL_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={item.rate}
                    onChange={(event) => update(item.key, { rate: Number(event.target.value) })}
                  />
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setItems((rows) => rows.filter((row) => row.key !== item.key))}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setItems((rows) => [...rows, emptyLine(`line-${rows.length + 1}`)])}
          >
            Tambah baris
          </Button>
          <p className="text-sm font-semibold">Total {formatRupiah(total)}</p>
        </div>
      </Card>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : payroll ? "Simpan rincian" : "Buat rincian gaji"}
      </Button>
    </form>
  );
}

export function PayrollPayForm({ payrollId }: { payrollId: string }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError("");
        start(async () => {
          await markPayrollPaid(payrollId, String(data.get("method") || "transfer") as PaymentMethod);
        });
      }}
    >
      <Field label="Cara bayar">
        <Select name="method" defaultValue="transfer">
          <option value="transfer">Transfer</option>
          <option value="tunai">Tunai</option>
        </Select>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Tandai lunas"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
