import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { stat } from "node:fs/promises";
import { requireSession } from "@/lib/auth";
import { fileMime, isPreviewableFile } from "@/lib/file-meta";
import { resolveUploadPath } from "@/lib/files";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  await requireSession();
  const { path: parts } = await params;
  const rel = (parts || []).join("/");
  const abs = resolveUploadPath(rel);
  if (!abs) return new Response("Tidak ditemukan", { status: 404 });
  try {
    const info = await stat(abs);
    if (!info.isFile()) return new Response("Tidak ditemukan", { status: 404 });
    const filename = parts.at(-1) || "file";
    const mime = fileMime(filename);
    const inline = isPreviewableFile(filename);
    const stream = createReadStream(abs);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": mime,
        "Content-Length": String(info.size),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename.replaceAll('"', "")}"`,
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch {
    return new Response("Tidak ditemukan", { status: 404 });
  }
}
