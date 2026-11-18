import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The admin login: one password, set as ADMIN_PASSWORD in Vercel (Project →
 * Settings → Environment Variables). Visitors never sign in; only whoever
 * knows the password can edit the site.
 *
 * Logging in sets a signed, http-only cookie that lasts 30 days. Changing
 * ADMIN_PASSWORD logs out every browser.
 */

export const OWNER_EMAIL = "saidraxmonovumarbek@gmail.com";

const SESSION = "admin_session";
/** Readable by the page, so it knows to load the editor. It grants nothing by itself. */
export const ADMIN_HINT = "admin_ui";
const DAYS = 30;

const password = () => process.env.ADMIN_PASSWORD ?? "";
export const passwordConfigured = () => password().length > 0;

const key = () => createHash("sha256").update(`admin-session:${password()}:${process.env.ADMIN_SECRET ?? ""}`).digest();
const sign = (value: string) => createHmac("sha256", key()).update(value).digest("base64url");

function same(a: string, b: string) {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export function checkPassword(attempt: string) {
  return passwordConfigured() && same(attempt, password());
}

export async function startSession() {
  const expires = Date.now() + DAYS * 864e5;
  const token = `${expires}.${sign(String(expires))}`;
  const jar = await cookies();
  const options = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", expires: new Date(expires) };
  jar.set(SESSION, token, { ...options, httpOnly: true });
  jar.set(ADMIN_HINT, "1", options);
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION);
  jar.delete(ADMIN_HINT);
}

/** Is this request from the logged-in owner? Check it in every action that changes something. */
export async function isAdmin(): Promise<boolean> {
  // read the request first, so a page that checks this is never prerendered
  const token = (await cookies()).get(SESSION)?.value;
  if (!token || !passwordConfigured()) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || Number(expires) < Date.now()) return false;
  return same(signature, sign(expires));
}
