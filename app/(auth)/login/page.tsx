import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getSession, safeNextPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getSession()) redirect("/");
  const { next } = await searchParams;

  return (
    <main className="flex min-h-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            R
          </span>
          <h1 className="mt-4 font-heading text-2xl">CV Rizky</h1>
          <p className="mt-1 text-sm text-muted-foreground">Masuk untuk mengelola percetakan & pengadaan.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <LoginForm nextPath={safeNextPath(next)} />
        </div>
      </div>
    </main>
  );
}
