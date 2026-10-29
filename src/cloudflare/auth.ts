import type { Env } from "./types";
const encoder = new TextEncoder();
const lifetime = 8 * 3600;
const cookieName = "inch_cf_session";
export const hex = (value: ArrayBuffer | Uint8Array) => Array.from(value instanceof Uint8Array ? value : new Uint8Array(value), n => n.toString(16).padStart(2, "0")).join("");
const unhex = (value: string) => new Uint8Array(value.match(/../g)!.map(v => parseInt(v, 16)));
export function configured(env: Env) {
  return /^pbkdf2\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(env.INCH_CF_PASSWORD_HASH ?? "") && (env.INCH_CF_SESSION_SECRET?.length ?? 0) >= 32;
}
async function sessionKey(env: Env) {
  return crypto.subtle.importKey("raw", encoder.encode(env.INCH_CF_SESSION_SECRET!), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function passwordMatches(password: string, env: Env) {
  if (!configured(env) || password.length > 256) return false;
  const [, iterations, salt, hash] = env.INCH_CF_PASSWORD_HASH!.split("$");
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", iterations: Number(iterations), salt: unhex(salt) }, key, 256);
  // HMAC verification compares the derived secret without a timing-sensitive string comparison.
  const compare = await crypto.subtle.importKey("raw", unhex(hash), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", compare, encoder.encode("inch-password-check"));
  const candidate = await crypto.subtle.importKey("raw", derived, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", candidate, signature, encoder.encode("inch-password-check"));
}
export async function isAdmin(request: Request, env: Env, now = Date.now()) {
  if (!configured(env)) return false;
  const token = request.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!token || !/^\d+\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expiry, nonce, signature] = token.split(".");
  const seconds = Math.floor(now / 1000);
  if (Number(expiry) <= seconds || Number(expiry) > seconds + lifetime) return false;
  return crypto.subtle.verify("HMAC", await sessionKey(env), unhex(signature), encoder.encode(`${expiry}.${nonce}`));
}
function cookie(value: string, request: Request, maxAge = lifetime) {
  return `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
export async function loginCookie(request: Request, env: Env) {
  const payload = `${Math.floor(Date.now() / 1000) + lifetime}.${hex(crypto.getRandomValues(new Uint8Array(16)))}`;
  const signature = hex(await crypto.subtle.sign("HMAC", await sessionKey(env), encoder.encode(payload)));
  return cookie(`${payload}.${signature}`, request);
}
export const logoutCookie = (request: Request) => cookie("", request, 0);
export async function loginAllowed(request: Request, env: Env) {
  const window = Math.floor(Date.now() / 300000);
  const key = hex(await crypto.subtle.sign("HMAC", await sessionKey(env), encoder.encode(`${request.headers.get("CF-Connecting-IP") ?? "local"}:${window}`)));
  const expires = (window + 1) * 300;
  const row = await env.DB.prepare("INSERT INTO inch_login_attempts (key, attempts, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1 RETURNING attempts").bind(key, expires).first<{ attempts: number }>();
  await env.DB.prepare("DELETE FROM inch_login_attempts WHERE expires < ?").bind(Math.floor(Date.now() / 1000)).run();
  return row !== null && row.attempts <= 8;
}
