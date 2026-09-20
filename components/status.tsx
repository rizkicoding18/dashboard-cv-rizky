import { Badge } from "@/components/form-controls";
import { INVOICE_STATUS_LABEL, ORDER_STATUS_LABEL } from "@/lib/labels";
import type { InvoiceStatus, OrderStatus } from "@/lib/types";

export function OrderBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === "selesai" ? "ok" : status === "dibatalkan" ? "bad" : status === "proses" ? "accent" : "warn";
  return <Badge tone={tone}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

export function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  const tone =
    status === "lunas"
      ? "ok"
      : status === "batal"
        ? "bad"
        : status === "sebagian"
          ? "warn"
          : status === "terbit"
            ? "accent"
            : "neutral";
  return <Badge tone={tone}>{INVOICE_STATUS_LABEL[status]}</Badge>;
}
