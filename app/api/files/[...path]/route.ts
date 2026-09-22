import { getSession } from "@/lib/auth";
import { fileMime, isPreviewableFile } from "@/lib/file-meta";
import { readUpload, sanitizeUploadPath } from "@/lib/files";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { path: parts } = await params;
  const rel = sanitizeUploadPath((parts || []).join("/"));
  if (!rel) return new Response("Tidak ditemukan", { status: 404 });
  try {
    const file = await readUpload(rel);
    if (!file) return new Response("Tidak ditemukan", { status: 404 });
    const filename = parts.at(-1) || "file";
    const mime = file.mime && file.mime !== "application/octet-stream" ? file.mime : fileMime(filename);
    const inline = isPreviewableFile(filename);
    const body = file.stream ?? file.bytes;
    if (!body) return new Response("Tidak ditemukan", { status: 404 });
    return new Response(body as BodyInit, {
      headers: {
        "Content-Type": mime,
        ...(file.size ? { "Content-Length": String(file.size) } : {}),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename.replaceAll('"', "")}"`,
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch (error) {
    console.error("File download failed", error);
    return new Response("Tidak ditemukan", { status: 404 });
  }
}
