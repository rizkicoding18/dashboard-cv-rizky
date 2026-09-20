import type { StoredFile } from "@/lib/types";

export const TAX_INVOICE_MIN = 10_000_000;

export type UploadKind = "photo" | "print" | "tax" | "spk" | "proof";

export const UPLOAD_LIMITS: Record<UploadKind, number> = {
  photo: 8 * 1024 * 1024,
  print: 50 * 1024 * 1024,
  tax: 12 * 1024 * 1024,
  spk: 12 * 1024 * 1024,
  proof: 12 * 1024 * 1024,
};

export const UPLOAD_EXTS: Record<UploadKind, string[]> = {
  photo: ["jpg", "jpeg", "png", "webp", "gif"],
  print: ["pdf", "cdr", "ai", "eps", "svg", "jpg", "jpeg", "png", "webp", "tif", "tiff", "psd"],
  tax: ["pdf", "jpg", "jpeg", "png", "webp"],
  spk: ["pdf", "jpg", "jpeg", "png", "webp"],
  proof: ["pdf", "jpg", "jpeg", "png", "webp"],
};

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  cdr: "application/x-coreldraw",
  ai: "application/postscript",
  eps: "application/postscript",
  psd: "image/vnd.adobe.photoshop",
};

export function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

export function uploadAccept(kind: UploadKind) {
  return UPLOAD_EXTS[kind].map((ext) => `.${ext}`).join(",");
}

export function filePublicUrl(file: StoredFile) {
  return `/api/files/${file.path
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function needsTaxInvoice(subtotal: number) {
  return subtotal >= TAX_INVOICE_MIN;
}

export function fileMime(name: string, fallback = "application/octet-stream") {
  return MIME[extensionOf(name)] || fallback;
}

export function isPreviewableFile(name: string) {
  return ["jpg", "jpeg", "png", "webp", "gif", "pdf", "svg"].includes(extensionOf(name));
}

export function isImageFile(file: StoredFile) {
  if (file.mime.startsWith("image/")) return true;
  return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extensionOf(file.name));
}
