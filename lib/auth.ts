import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth-constants";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function credentials() {
  return {
    username: process.env.AUTH_USERNAME || "admin",
    password: process.env.AUTH_PASSWORD || "rizky",
    secret: process.env.AUTH_SECRET || "cv-rizky-local-secret",
  };
}

function hmac(value: string) {
  return createHmac("sha256", credentials().secret).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function verifyCredentials(username: string, password: string) {
  const expected = credentials();
  return safeEqual(username.trim(), expected.username) && safeEqual(password, expected.password);
}

function sign(username: string, exp: number) {
  const payload = `${username}|${exp}`;
  return `${payload}.${hmac(payload)}`;
}

function readToken(token: string | undefined) {
  if (!token) return null;
  const cut = token.lastIndexOf(".");
  if (cut <= 0) return null;
  const payload = token.slice(0, cut);
  const signature = token.slice(cut + 1);
  if (!safeEqual(hmac(payload), signature)) return null;
  const [username, expRaw] = payload.split("|");
  const exp = Number(expRaw);
  if (!username || !Number.isFinite(exp) || exp < Date.now()) return null;
  return { username };
}

export async function getSession() {
  const store = await cookies();
  return readToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function createSession(username: string) {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const store = await cookies();
  store.set(SESSION_COOKIE, sign(username.trim(), exp), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) {
    return "/";
  }
  return value;
}
