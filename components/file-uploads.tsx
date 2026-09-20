"use client";

import { useId, useState, useTransition } from "react";
import {
  removeOrderTaxInvoice,
  removeProductPhoto,
  removeProductPrintFile,
  uploadOrderTaxInvoice,
  uploadProductPhoto,
  uploadProductPrintFiles,
} from "@/app/actions";
import { ConfirmSubmit } from "@/components/line-items";
import { Button, Card, Field, Input, Select } from "@/components/form-controls";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableHeader, TableRow, Td, Th } from "@/components/shared";
import { filePublicUrl, formatFileSize, isImageFile, needsTaxInvoice, TAX_INVOICE_MIN, uploadAccept } from "@/lib/file-meta";
import { formatDate, formatRupiah } from "@/lib/format";
import type { StoredFile } from "@/lib/types";

function FileUploadForm({
  accept,
  multiple,
  label,
  hint,
  buttonLabel,
  action,
}: {
  accept: string;
  multiple?: boolean;
  label: string;
  hint: string;
  buttonLabel: string;
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        setError("");
        start(async () => {
          const result = await action(data);
          if (result?.error) setError(result.error);
          else form.reset();
        });
      }}
    >
      <Field label={label} hint={hint}>
        <Input name={multiple ? "files" : "file"} type="file" accept={accept} multiple={multiple} required />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Mengunggah..." : buttonLabel}
        </Button>
      </div>
    </form>
  );
}

export function CompactFileUpload({
  action,
  accept,
  label,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  accept: string;
  label: string;
}) {
  const inputId = useId();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="absolute size-px overflow-hidden opacity-0"
        disabled={pending}
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          if (!file) return;
          const data = new FormData();
          data.set("file", file);
          setError("");
          start(async () => {
            const result = await action(data);
            if (result?.error) setError(result.error);
            input.value = "";
          });
        }}
      />
      <label
        htmlFor={inputId}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "cursor-pointer",
          pending && "pointer-events-none opacity-50",
        )}
      >
        {pending ? "Mengunggah..." : label}
      </label>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

function FileCard({
  file,
  onRemove,
  removeLabel,
  removeMessage,
}: {
  file: StoredFile;
  onRemove: () => Promise<unknown>;
  removeLabel: string;
  removeMessage: string;
}) {
  const href = filePublicUrl(file);
  const imagePreview = isImageFile(file);

  return (
    <div className="flex gap-3 rounded-xl border p-3">
      {imagePreview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={href} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
      ) : null}
      <div className="min-w-0 flex-1">
        <a href={href} download={file.name} className="break-all font-medium text-primary">
          {file.name}
        </a>
        <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={href} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary">
            Buka
          </a>
          <ConfirmSubmit label={removeLabel} message={removeMessage} variant="outline" action={onRemove} />
        </div>
      </div>
    </div>
  );
}

export function ProductMediaCard({
  productId,
  category,
  photo,
  printFiles,
}: {
  productId: string;
  category?: string;
  photo: StoredFile | null;
  printFiles: StoredFile[];
}) {
  const showPrintFiles = category === "percetakan";
  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <h2 className="font-heading text-xl">Foto barang</h2>
        <p className="mt-1 text-sm text-muted-foreground">Gambar contoh hasil jadi, supaya gampang dikenali di katalog.</p>
        <div className="mt-4 grid gap-3">
          {photo ? (
            <FileCard
              file={photo}
              removeLabel="Hapus foto"
              removeMessage="Hapus foto barang ini?"
              onRemove={removeProductPhoto.bind(null, productId)}
            />
          ) : null}
          <FileUploadForm
            accept={uploadAccept("photo")}
            label={photo ? "Ganti foto" : "Unggah foto"}
            hint="JPG, PNG, atau WEBP. Maksimal 8 MB."
            buttonLabel={photo ? "Ganti foto" : "Unggah foto"}
            action={uploadProductPhoto.bind(null, productId)}
          />
        </div>
      </Card>
      {showPrintFiles ? (
      <Card className="p-5">
        <h2 className="font-heading text-xl">File untuk dicetak</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bisa lebih dari satu: CorelDraw, PDF, gambar, Adobe Illustrator (.ai), EPS, atau Photoshop.
        </p>
        <div className="mt-4 grid gap-3">
          {printFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada file cetak.</p>
          ) : (
            printFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                removeLabel="Hapus"
                removeMessage={`Hapus ${file.name}?`}
                onRemove={removeProductPrintFile.bind(null, productId, file.id)}
              />
            ))
          )}
          <FileUploadForm
            accept={uploadAccept("print")}
            multiple
            label="Tambah file"
            hint="Bisa pilih beberapa file sekaligus. Maksimal 50 MB per file."
            buttonLabel="Unggah file cetak"
            action={uploadProductPrintFiles.bind(null, productId)}
          />
        </div>
      </Card>
      ) : null}
    </div>
  );
}

export type TaxInvoiceOrderOption = {
  id: string;
  number: string;
  customerName: string;
  date: string;
  subtotal: number;
  taxInvoice: StoredFile | null;
};

export function TaxInvoiceSection({
  orders,
  defaultOrderId,
}: {
  orders: TaxInvoiceOrderOption[];
  defaultOrderId?: string;
}) {
  const missing = orders.filter((order) => needsTaxInvoice(order.subtotal) && !order.taxInvoice);
  const files = orders.filter((order) => order.taxInvoice);

  return (
    <section id="faktur-pajak" className="grid gap-3">
      <div>
        <h2 className="font-heading text-2xl">Faktur pajak</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Unggah PDF atau gambar. Wajib untuk order {formatRupiah(TAX_INVOICE_MIN)} atau lebih. File yang sudah masuk tampil di daftar ini.
        </p>
      </div>
      {missing.length > 0 ? (
        <Alert>
          <AlertTitle>{missing.length} order belum punya faktur pajak</AlertTitle>
          <AlertDescription>
            {missing.map((order) => order.number).join(", ")}
          </AlertDescription>
        </Alert>
      ) : null}
      <Card className="p-5">
        <TaxInvoiceUploadForm orders={orders} defaultOrderId={defaultOrderId} />
      </Card>
      {files.length === 0 ? (
        <Card>
          <p className="px-5 py-8 text-sm text-muted-foreground">Belum ada faktur pajak yang diunggah.</p>
        </Card>
      ) : (
        <Card>
          <div className="grid gap-3 p-4 md:hidden">
            {files.map((order) => {
              const file = order.taxInvoice;
              if (!file) return null;
              const href = filePublicUrl(file);
              return (
                <div key={order.id} className="rounded-xl border p-4">
                  <p className="font-medium">{file.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.number} · {order.customerName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(file.uploadedAt)} · {formatFileSize(file.size)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">
                      Buka
                    </a>
                    <ConfirmSubmit
                      label="Hapus"
                      message="Hapus faktur pajak ini?"
                      variant="outline"
                      action={removeOrderTaxInvoice.bind(null, order.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <Th>File</Th>
                  <Th>Order</Th>
                  <Th>Perusahaan</Th>
                  <Th>Tanggal</Th>
                  <Th>Aksi</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((order) => {
                  const file = order.taxInvoice;
                  if (!file) return null;
                  const href = filePublicUrl(file);
                  return (
                    <TableRow key={order.id}>
                      <Td className="font-medium">{file.name}</Td>
                      <Td>{order.number}</Td>
                      <Td>{order.customerName}</Td>
                      <Td>{formatDate(file.uploadedAt)}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <a href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">
                            Buka
                          </a>
                          <ConfirmSubmit
                            label="Hapus"
                            message="Hapus faktur pajak ini?"
                            variant="outline"
                            action={removeOrderTaxInvoice.bind(null, order.id)}
                          />
                        </div>
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </section>
  );
}

function TaxInvoiceUploadForm({
  orders,
  defaultOrderId,
}: {
  orders: TaxInvoiceOrderOption[];
  defaultOrderId?: string;
}) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [orderId, setOrderId] = useState(defaultOrderId || orders[0]?.id || "");
  const selected = orders.find((order) => order.id === orderId);

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!orderId) {
          setError("Pilih order.");
          return;
        }
        const form = event.currentTarget;
        const data = new FormData(form);
        setError("");
        start(async () => {
          const result = await uploadOrderTaxInvoice(orderId, data);
          if (result?.error) setError(result.error);
          else form.reset();
        });
      }}
    >
      <Field label="Order">
        <Select name="orderId" value={orderId} onChange={(event) => setOrderId(event.target.value)} required>
          <option value="">Pilih order</option>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.number} · {order.customerName}
              {order.taxInvoice ? " (ganti file)" : needsTaxInvoice(order.subtotal) ? " (wajib)" : ""}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="File faktur pajak" hint="PDF, JPG, PNG, atau WEBP. Maksimal 12 MB.">
        <Input name="file" type="file" accept={uploadAccept("tax")} required />
      </Field>
      {selected ? (
        <p className="sm:col-span-2 text-xs text-muted-foreground">
          Nilai order {formatRupiah(selected.subtotal)}
          {needsTaxInvoice(selected.subtotal) ? ` · wajib karena ≥ ${formatRupiah(TAX_INVOICE_MIN)}` : ""}.
        </p>
      ) : null}
      {error ? <p className="sm:col-span-2 text-sm text-destructive">{error}</p> : null}
      <div>
        <Button type="submit" disabled={pending || !orderId}>
          {pending ? "Mengunggah..." : selected?.taxInvoice ? "Ganti faktur pajak" : "Unggah faktur pajak"}
        </Button>
      </div>
    </form>
  );
}
