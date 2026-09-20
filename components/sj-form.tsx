"use client";

import { useState, useTransition } from "react";
import { createSuratJalan } from "@/app/actions";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/form-controls";
import { todayIso } from "@/lib/format";
import { UNIT_OPTIONS } from "@/lib/labels";
import type { Customer, DraftSjLine } from "@/lib/types";

function emptyLine(key = "line-1"): DraftSjLine {
  return {
    key,
    name: "",
    spec: "",
    qty: 1,
    unit: "pcs",
    notes: "",
  };
}

export function SuratJalanForm({
  customers,
  defaultCustomerId,
  defaultInvoiceId,
  defaultOrderId,
  defaultItems,
  defaultDestination,
  lockCustomer,
}: {
  customers: Customer[];
  defaultCustomerId?: string;
  defaultInvoiceId?: string | null;
  defaultOrderId?: string | null;
  defaultItems?: DraftSjLine[];
  defaultDestination?: string;
  lockCustomer?: boolean;
}) {
  const [customerId, setCustomerId] = useState(defaultCustomerId || customers[0]?.id || "");
  const [items, setItems] = useState<DraftSjLine[]>(defaultItems || [emptyLine()]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setError("");
        start(async () => {
          const result = await createSuratJalan({
            customerId,
            invoiceId: defaultInvoiceId || null,
            orderId: defaultOrderId || null,
            date: String(data.get("date") || todayIso()),
            destination: String(data.get("destination") || ""),
            vehicle: String(data.get("vehicle") || ""),
            driver: String(data.get("driver") || ""),
            notes: String(data.get("notes") || ""),
            items,
          });
          if (result?.error) setError(result.error);
        });
      }}
    >
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        {lockCustomer ? (
          <Field label="Perusahaan tujuan">
            <Input
              readOnly
              value={customers.find((customer) => customer.id === customerId)?.name || ""}
            />
          </Field>
        ) : (
          <Field label="Perusahaan tujuan">
            <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Pilih perusahaan</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Tanggal kirim">
          <Input name="date" type="date" defaultValue={todayIso()} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Alamat tujuan">
            <Input name="destination" defaultValue={defaultDestination} placeholder="Alamat pengiriman" />
          </Field>
        </div>
        <Field label="Kendaraan">
          <Input name="vehicle" placeholder="Nomor polisi / jenis" />
        </Field>
        <Field label="Pengemudi">
          <Input name="driver" placeholder="Nama pengemudi" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Catatan">
            <Textarea name="notes" placeholder="Kondisi kirim, jam tiba, PIC gudang..." />
          </Field>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-4 font-heading text-xl">Barang yang dikirim</h2>
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.key} className="grid gap-2 rounded-2xl border border-border bg-white p-3 md:grid-cols-12">
              <Input
                className="md:col-span-4"
                value={item.name}
                placeholder="Nama"
                onChange={(event) =>
                  setItems((rows) =>
                    rows.map((row) => (row.key === item.key ? { ...row, name: event.target.value } : row)),
                  )
                }
              />
              <Input
                className="md:col-span-3"
                value={item.spec}
                placeholder="Spesifikasi"
                onChange={(event) =>
                  setItems((rows) =>
                    rows.map((row) => (row.key === item.key ? { ...row, spec: event.target.value } : row)),
                  )
                }
              />
              <Input
                className="md:col-span-1"
                type="number"
                min={0}
                value={item.qty}
                onChange={(event) =>
                  setItems((rows) =>
                    rows.map((row) => (row.key === item.key ? { ...row, qty: Number(event.target.value) } : row)),
                  )
                }
              />
              <Select
                className="md:col-span-1"
                value={item.unit}
                onChange={(event) =>
                  setItems((rows) =>
                    rows.map((row) => (row.key === item.key ? { ...row, unit: event.target.value } : row)),
                  )
                }
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </Select>
              <Input
                className="md:col-span-2"
                value={item.notes}
                placeholder="Keterangan"
                onChange={(event) =>
                  setItems((rows) =>
                    rows.map((row) => (row.key === item.key ? { ...row, notes: event.target.value } : row)),
                  )
                }
              />
              <button
                type="button"
                className="text-left text-xs text-destructive md:col-span-1 md:text-right"
                onClick={() => setItems((rows) => rows.filter((row) => row.key !== item.key))}
              >
                Hapus
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setItems((rows) => [...rows, emptyLine(`line-${rows.length + 1}`)])}>
            Tambah baris
          </Button>
        </div>
      </Card>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Buat surat jalan"}
        </Button>
      </div>
    </form>
  );
}
