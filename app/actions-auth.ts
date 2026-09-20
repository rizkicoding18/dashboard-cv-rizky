"use server";

import { redirect } from "next/navigation";
import {
  clearSession,
  createSession,
  safeNextPath,
  verifyCredentials,
} from "@/lib/auth";

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  if (!verifyCredentials(username, password)) {
    return { error: "Nama pengguna atau kata sandi salah." };
  }
  await createSession(username);
  redirect(safeNextPath(String(formData.get("next") || "/")));
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
