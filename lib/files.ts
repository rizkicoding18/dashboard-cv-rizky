import { mkdir, unlink, writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { del as delBlob, get as getBlob, put as putBlob } from "@vercel/blob";
import { createId } from "@/lib/ids";
import {
  extensionOf,
  type UploadKind,
  UPLOAD_EXTS,
  UPLOAD_LIMITS,
} from "@/lib/file-meta";
import { deleteStoredFile, getStoredFile, putStoredFile } from "@/lib/sql";
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

export type BlobAccess = "public" | "private";

export function blobAccess(): BlobAccess {
  return process.env.BLOB_ACCESS === "private" ? "private" : "public";
}

export function blobStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

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

export function sanitizeUploadPath(rel: string) {
  return rel
    .split(/[\\/]/)
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

function kindError(kind: UploadKind) {
  if (kind === "print") return "Unggah PDF, CorelDraw (.cdr), Illustrator (.ai), gambar, atau EPS.";
  if (kind === "tax") return "Faktur pajak berupa PDF atau gambar.";
  if (kind === "spk") return "SPK berupa PDF atau gambar.";
  if (kind === "proof") return "Bukti pembayaran berupa PDF atau gambar.";
  return "Foto berupa JPG, PNG, atau WEBP.";
}

function sizeError(kind: UploadKind) {
  if (kind === "print") return "File maksimal 50 MB.";
  if (kind === "photo") return "Foto maksimal 8 MB.";
  return "File maksimal 12 MB.";
}

export function validateUpload(
  file: Pick<File, "name" | "size">,
  kind: UploadKind,
): { error: string } | { ext: string } {
  if (!file || file.size === 0) return { error: "Pilih file dulu." };
  if (file.size > UPLOAD_LIMITS[kind]) return { error: sizeError(kind) };
  const ext = extensionOf(file.name);
  if (!UPLOAD_EXTS[kind].includes(ext)) return { error: kindError(kind) };
  return { ext };
}

async function putToBlob(rel: string, bytes: Uint8Array, mime: string) {
  await putBlob(rel, Buffer.from(bytes), {
    access: blobAccess(),
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: mime || "application/octet-stream",
    multipart: bytes.byteLength > 4.5 * 1024 * 1024,
  });
}

async function persistBytes(rel: string, bytes: Uint8Array, mime: string, name: string) {
  if (blobStorageEnabled()) {
    try {
      await putToBlob(rel, bytes, mime);
      return;
    } catch (error) {
      console.error("Blob upload failed", error);
    }
  }

  if (!process.env.VERCEL) {
    const abs = resolveUploadPath(rel);
    if (!abs) throw new Error("Path tidak valid.");
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, Buffer.from(bytes));
    return;
  }

  try {
    await putStoredFile(rel, bytes, mime, name);
  } catch (error) {
    console.error("Database file upload failed", error);
    throw new Error(
      "Gagal menyimpan file di server. Hubungkan Vercel Blob ke project, atau unggah file di bawah 4 MB.",
    );
  }
}

export async function saveUpload(
  file: File,
  folder: string,
  kind: UploadKind,
): Promise<StoredFile | { error: string }> {
  const checked = validateUpload(file, kind);
  if ("error" in checked) return checked;
  const id = createId("file");
  const rel = sanitizeUploadPath(`${folder}/${id}.${checked.ext}`);
  if (!rel) return { error: "Path tidak valid." };
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await persistBytes(rel, bytes, file.type || "application/octet-stream", file.name);
    return {
      id,
      name: file.name,
      path: rel,
      mime: file.type || "application/octet-stream",
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("saveUpload failed", error);
    return {
      error: error instanceof Error ? error.message : "Gagal menyimpan file.",
    };
  }
}

type BlobMeta = {
  pathname: string;
  name: string;
  mime: string;
  size: number;
};

function blobFilesFromForm(formData: FormData): BlobMeta[] {
  const raw = String(formData.get("blobFiles") || "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as BlobMeta[];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.pathname && item?.name) : [];
  } catch {
    return [];
  }
}

export function formFiles(formData: FormData) {
  const files: File[] = [];
  for (const name of ["file", "files"]) {
    for (const value of formData.getAll(name)) {
      if (value instanceof File && value.size > 0) files.push(value);
    }
  }
  return files;
}

export async function saveUploadsFromForm(
  formData: FormData,
  folder: string,
  kind: UploadKind,
  missingError: string,
  optional = false,
): Promise<StoredFile[] | { error: string }> {
  const remote = blobFilesFromForm(formData);
  if (remote.length) {
    const saved: StoredFile[] = [];
    for (const item of remote) {
      const checked = validateUpload({ name: item.name, size: item.size }, kind);
      if ("error" in checked) return checked;
      const rel = sanitizeUploadPath(item.pathname);
      if (!rel || !rel.startsWith(`${sanitizeUploadPath(folder)}/`)) {
        return { error: "Path unggahan tidak valid." };
      }
      saved.push({
        id: path.basename(rel).replace(/\.[^.]+$/, "") || createId("file"),
        name: item.name,
        path: rel,
        mime: item.mime || "application/octet-stream",
        size: item.size,
        uploadedAt: new Date().toISOString(),
      });
    }
    return saved;
  }

  const incoming = formFiles(formData);
  if (!incoming.length) return optional ? [] : { error: missingError };
  const saved: StoredFile[] = [];
  for (const file of incoming) {
    const result = await saveUpload(file, folder, kind);
    if ("error" in result) {
      await Promise.all(saved.map((item) => removeUpload(item)));
      return result;
    }
    saved.push(result);
  }
  return saved;
}

export async function saveOneFromForm(
  formData: FormData,
  folder: string,
  kind: UploadKind,
  missingError: string,
): Promise<StoredFile | { error: string }> {
  const result = await saveUploadsFromForm(formData, folder, kind, missingError);
  if ("error" in result) return result;
  return result[0] ?? { error: missingError };
}

export async function readUpload(rel: string): Promise<{
  bytes?: Uint8Array;
  stream?: ReadableStream<Uint8Array>;
  mime: string;
  size: number;
} | null> {
  const safe = sanitizeUploadPath(rel);
  if (!safe) return null;

  const abs = resolveUploadPath(safe);
  if (abs) {
    try {
      const info = await stat(abs);
      if (info.isFile()) {
        return {
          bytes: await readFile(abs),
          mime: "application/octet-stream",
          size: info.size,
        };
      }
    } catch {
      // continue
    }
  }

  if (blobStorageEnabled()) {
    for (const access of [blobAccess(), blobAccess() === "private" ? "public" : "private"] as BlobAccess[]) {
      try {
        const result = await getBlob(safe, { access, useCache: false });
        if (result?.statusCode === 200 && result.stream) {
          return {
            stream: result.stream,
            mime: result.blob.contentType || "application/octet-stream",
            size: result.blob.size || 0,
          };
        }
      } catch {
        // try the other access mode / next store
      }
    }
  }

  const stored = await getStoredFile(safe).catch(() => null);
  if (!stored) return null;
  return { bytes: stored.bytes, mime: stored.mime, size: stored.size };
}

export async function removeUpload(file: StoredFile | null | undefined) {
  if (!file?.path) return;
  const rel = sanitizeUploadPath(file.path);
  if (!rel) return;
  const abs = resolveUploadPath(rel);
  if (abs) await unlink(abs).catch(() => undefined);
  if (blobStorageEnabled()) {
    await delBlob(rel).catch(() => undefined);
  }
  await deleteStoredFile(rel).catch(() => undefined);
}
