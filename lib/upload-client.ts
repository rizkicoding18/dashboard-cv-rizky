"use client";

import { upload } from "@vercel/blob/client";
import { createId } from "@/lib/ids";
import { extensionOf, type UploadKind } from "@/lib/file-meta";

type StorageInfo = { blob: boolean; access: "public" | "private" };

let cached: StorageInfo | null = null;

async function storageInfo(): Promise<StorageInfo> {
  if (cached) return cached;
  try {
    const response = await fetch("/api/blob/upload", { cache: "no-store" });
    if (!response.ok) return { blob: false, access: "public" };
    const data = (await response.json()) as StorageInfo;
    cached = { blob: Boolean(data.blob), access: data.access === "private" ? "private" : "public" };
    return cached;
  } catch {
    return { blob: false, access: "public" };
  }
}

function filesFromForm(data: FormData) {
  const files: File[] = [];
  for (const name of ["file", "files"]) {
    for (const value of data.getAll(name)) {
      if (value instanceof File && value.size > 0) files.push(value);
    }
  }
  return files;
}

export async function attachFilesForDeployment(data: FormData, folder: string, kind: UploadKind) {
  const files = filesFromForm(data);
  if (!files.length) return data;
  const info = await storageInfo();
  if (!info.blob) return data;
  try {
    const uploaded: { pathname: string; name: string; mime: string; size: number }[] = [];
    for (const file of files) {
      const ext = extensionOf(file.name) || "bin";
      const pathname = `${folder.replace(/^\/+|\/+$/g, "")}/${createId("file")}.${ext}`;
      await upload(pathname, file, {
        access: info.access,
        handleUploadUrl: "/api/blob/upload",
        multipart: file.size > 4.5 * 1024 * 1024,
        clientPayload: JSON.stringify({ kind }),
      });
      uploaded.push({
        pathname,
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
      });
    }
    data.delete("file");
    data.delete("files");
    data.set("blobFiles", JSON.stringify(uploaded));
    return data;
  } catch (error) {
    console.error("Direct blob upload failed, falling back to server upload", error);
    cached = { blob: false, access: info.access };
    return data;
  }
}
