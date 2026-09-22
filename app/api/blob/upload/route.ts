import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";
import { blobAccess, blobStorageEnabled, sanitizeUploadPath } from "@/lib/files";
import { extensionOf, UPLOAD_EXTS, UPLOAD_LIMITS, type UploadKind } from "@/lib/file-meta";

export const dynamic = "force-dynamic";

const KINDS = new Set<UploadKind>(["photo", "print", "tax", "spk", "proof"]);

export async function POST(request: Request) {
  if (!blobStorageEnabled()) {
    return Response.json({ error: "Blob storage belum dikonfigurasi." }, { status: 501 });
  }
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onUploadCompleted: async () => undefined,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const rel = sanitizeUploadPath(pathname);
        if (!rel) throw new Error("Path tidak valid.");
        let kind: UploadKind = "proof";
        try {
          const payload = clientPayload ? (JSON.parse(clientPayload) as { kind?: UploadKind }) : {};
          if (payload.kind && KINDS.has(payload.kind)) kind = payload.kind;
        } catch {
          // keep default
        }
        const ext = extensionOf(rel);
        if (!UPLOAD_EXTS[kind].includes(ext)) throw new Error("Jenis file tidak didukung.");
        return {
          maximumSizeInBytes: UPLOAD_LIMITS[kind],
          addRandomSuffix: false,
          allowOverwrite: true,
          tokenPayload: JSON.stringify({ kind }),
        };
      },
    });
    return Response.json(json);
  } catch (error) {
    console.error("Blob handleUpload failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Gagal mengunggah file." },
      { status: 400 },
    );
  }
}

export async function GET() {
  return Response.json({
    blob: blobStorageEnabled(),
    access: blobAccess(),
  });
}
