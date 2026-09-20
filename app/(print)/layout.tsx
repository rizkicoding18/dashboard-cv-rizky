import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <div className="min-h-full bg-white text-stone-900">{children}</div>;
}
