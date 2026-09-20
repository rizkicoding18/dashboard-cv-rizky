import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createId } from "@/lib/ids";
import {
  extensionOf,
  type UploadKind,
  UPLOAD_EXTS,
  UPLOAD_LIMITS,
} from "@/lib/file-meta";
import type { StoredFile } from "@/lib/types";

export {
  fileMime,
  filePublicUrl,
  formatFileSize,
  isPreviewableFile,
  needsTaxInvoice,
  TAX_INVOICE_MIN,
  uploadAccept,
} from "@/lib/file-meta";
export type { UploadKind } from "@/lib/file-meta";

export const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

function insideRoot(abs: string) {
  const root = path.resolve(UPLOAD_ROOT);
  const resolved = path.resolve(abs);
  return resolved === root || resolved.startsWith(root + path.sep);
}

export function resolveUploadPath(rel: string) {
  const cleaned = rel.split(/[\\/]/).filter((part) => part && part !== "." && part !== "..");
  if (!cleaned.length) return null;
  const abs = path.join(UPLOAD_ROOT, ...cleaned);
  return insideRoot(abs) ? abs : null;
}

export async function saveUpload(file: File, folder: string, kind: UploadKind): Promise<StoredFile | { error: string }> {
  if (!file || file.size === 0) return { error: "Pilih file dulu." };
  if (file.size > UPLOAD_LIMITS[kind]) {
    return {
      error:
        kind === "print"
          ? "File maksimal 50 MB."
          : kind === "photo"
            ? "Foto maksimal 8 MB."
            : "File maksimal 12 MB.",
    };
  }
  const ext = extensionOf(file.name);
  if (!UPLOAD_EXTS[kind].includes(ext)) {
    return {
      error:
        kind === "print"
          ? "Unggah PDF, CorelDraw (.cdr), Illustrator (.ai), gambar, atau EPS."
          : kind === "tax"
            ? "Faktur pajak berupa PDF atau gambar."
            : kind === "spk"
              ? "SPK berupa PDF atau gambar."
              : kind === "proof"
                ? "Bukti pembayaran berupa PDF atau gambar."
                : "Foto berupa JPG, PNG, atau WEBP.",
    };
  }
  const id = createId("file");
  const rel = `${folder.replaceAll("\\", "/")}/${id}.${ext}`.replace(/^\/+/, "");
  const abs = resolveUploadPath(rel);
  if (!abs) return { error: "Path tidak valid." };
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, Buffer.from(await file.arrayBuffer()));
  return {
    id,
    name: file.name,
    path: rel,
    mime: file.type || "application/octet-stream",
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

export async function removeUpload(file: StoredFile | null | undefined) {
  if (!file?.path) return;
  const abs = resolveUploadPath(file.path);
  if (!abs) return;
  await unlink(abs).catch(() => undefined);
}
