import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "bm_csrf";
const TOKEN_BYTES = 24;

function secret(): string {
  const fromEnv = process.env.CSRF_SECRET?.trim();
  if (fromEnv) return fromEnv;
  // Fallback for local/dev without CSRF_SECRET — still requires cookie match.
  const db = process.env.DATABASE_URL?.trim() ?? "local-dev";
  return createHmac("sha256", "bm-csrf").update(db).digest("hex");
}

function sign(token: string): string {
  return createHmac("sha256", secret()).update(token).digest("base64url");
}

export function createCsrfToken(): string {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return `${token}.${sign(token)}`;
}

export function verifyCsrfToken(token: string | null | undefined): boolean {
  if (!token || !token.includes(".")) return false;
  const [raw, sig] = token.split(".");
  if (!raw || !sig) return false;
  const expected = sign(raw);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function readCsrfCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

export async function setCsrfCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function csrfTokensMatch(
  cookieToken: string | null,
  headerToken: string | null,
): boolean {
  if (!cookieToken || !headerToken) return false;
  if (!verifyCsrfToken(cookieToken) || !verifyCsrfToken(headerToken)) return false;
  try {
    const a = Buffer.from(cookieToken);
    const b = Buffer.from(headerToken);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
