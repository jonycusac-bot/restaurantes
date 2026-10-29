import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { config } from "dotenv";

if (process.env.NODE_ENV !== "production") config({ path: ".env.admin.local", quiet: true });
export const sessionCookie = "inch_admin_session";
const lifetime = 8 * 60 * 60;
function secrets() {
  const hash = process.env.INCH_ADMIN_PASSWORD_HASH;
  const key = process.env.INCH_ADMIN_SESSION_SECRET;
  return hash && key && key.length >= 32 ? { hash, key } : null;
}
export function passwordMatches(password: string) {
  const settings = secrets(); if (!settings || password.length > 256) return false;
  const [salt, hash] = settings.hash.split(":");
  if (!salt || !/^[a-f0-9]{128}$/.test(hash ?? "")) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex"));
}
export function validSession(value?: string, now = Date.now()) {
  const settings = secrets(); if (!settings || !value) return false;
  const parts = value.split("."); if (parts.length !== 3) return false;
  const [expiry, nonce, signature] = parts;
  const seconds = Math.floor(now / 1000);
  if (!/^\d+$/.test(expiry) || Number(expiry) <= seconds || Number(expiry) > seconds + lifetime || !/^[a-f0-9]{32}$/.test(nonce) || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = createHmac("sha256", settings.key).update(`${expiry}.${nonce}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function cookieFromRequest(request: Request) {
  return request.headers.get("cookie")?.split(";").map(s => s.trim()).find(s => s.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1);
}
function cookie(value: string, secure: boolean, maxAge = lifetime) {
  return `${sessionCookie}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
export async function authAction(request: Request) {
  const url = new URL(request.url);
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (request.method !== "POST") return new Response(null, { status: 405, headers });
  if (request.headers.get("origin") !== url.origin) return new Response(null, { status: 403, headers });
  if (url.pathname.endsWith("/logout")) return Response.json({ ok: true }, { headers: { ...headers, "Set-Cookie": cookie("", url.protocol === "https:", 0) } });
  if (!secrets()) return Response.json({ error: "Acceso aún sin configurar en el servidor." }, { status: 503, headers });
  if (!request.headers.get("content-type")?.includes("application/json")) return new Response(null, { status: 415, headers });
  const body = await request.text(); if (body.length > 1024) return new Response(null, { status: 413, headers });
  let password: unknown;
  try { password = JSON.parse(body).password; } catch { return new Response(null, { status: 400, headers }); }
  if (typeof password !== "string" || !passwordMatches(password)) return Response.json({ error: "Contraseña incorrecta." }, { status: 401, headers });
  const payload = `${Math.floor(Date.now() / 1000) + lifetime}.${randomBytes(16).toString("hex")}`;
  const signature = createHmac("sha256", secrets()!.key).update(payload).digest("hex");
  return Response.json({ ok: true }, { headers: { ...headers, "Set-Cookie": cookie(`${payload}.${signature}`, url.protocol === "https:") } });
}
