"use client";

import { Button } from "@/components/form-controls";

export function PrintButton({ label = "Cetak" }: { label?: string }) {
  return (
    <Button
      type="button"
      onClick={() => {
        const previous = document.title;
        document.title = " ";
        const restore = () => {
          document.title = previous;
          window.removeEventListener("afterprint", restore);
        };
        window.addEventListener("afterprint", restore);
        window.print();
      }}
    >
      {label}
    </Button>
  );
}
