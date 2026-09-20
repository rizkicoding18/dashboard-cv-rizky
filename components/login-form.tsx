"use client";

import { useActionState } from "react";
import { login } from "@/app/actions-auth";
import { Button, Field, Input } from "@/components/form-controls";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={nextPath} />
      <Field label="Nama pengguna">
        <Input name="username" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Kata sandi">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Masuk..." : "Masuk"}
      </Button>
    </form>
  );
}
