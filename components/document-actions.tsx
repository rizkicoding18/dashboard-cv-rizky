"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/form-controls";
import { PrintButton } from "@/components/print-button";
import { ButtonLink } from "@/components/shared";

function filenameFromResponse(response: Response, href: string) {
  const header = response.headers.get("Content-Disposition");
  const utf = header?.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1]);
    } catch {
      // fall through
    }
  }
  const quoted = header?.match(/filename="([^"]+)"/i);
  if (quoted?.[1]) return quoted[1];
  const plain = header?.match(/filename=([^;]+)/i);
  if (plain?.[1]) return plain[1].trim();
  const parts = href.split("/").filter(Boolean);
  return `${parts.at(-2) ?? "dokumen"}-${parts.at(-1) ?? "file"}.pdf`;
}

export function DownloadPdfButton({
  href,
  label,
  size = "md",
  className,
}: {
  href: string;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function download() {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(href, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(response.status === 404 ? "Dokumen tidak ditemukan" : "Gagal mengunduh PDF");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFromResponse(response, href);
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengunduh PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={loading}
      aria-busy={loading}
      onClick={download}
      className={className}
    >
      {loading ? <Loader2Icon className="animate-spin" /> : null}
      {loading && size !== "sm" ? "Mengunduh..." : label}
    </Button>
  );
}

export function PrintToolbar({
  backHref,
  pdfHref,
  printLabel,
  pdfLabel,
}: {
  backHref: string;
  pdfHref: string;
  printLabel: string;
  pdfLabel: string;
}) {
  return (
    <div className="no-print mx-auto mb-4 flex max-w-[800px] flex-wrap items-center justify-between gap-2">
      <ButtonLink href={backHref} variant="outline">
        Kembali
      </ButtonLink>
      <div className="flex flex-wrap gap-2">
        <DownloadPdfButton href={pdfHref} label={pdfLabel} />
        <PrintButton label={printLabel} />
      </div>
    </div>
  );
}

export function DocActions({
  printHref,
  pdfHref,
  extra,
}: {
  printHref: string;
  pdfHref: string;
  extra?: React.ReactNode;
}) {
  return (
    <>
      <ButtonLink href={printHref} variant="outline">
        Cetak
      </ButtonLink>
      <DownloadPdfButton href={pdfHref} label="Unduh PDF" />
      {extra}
    </>
  );
}
