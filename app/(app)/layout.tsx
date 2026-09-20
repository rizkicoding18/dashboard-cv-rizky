import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  const db = await readDb();
  return <AppShell companyName={db.profile.name}>{children}</AppShell>;
}
