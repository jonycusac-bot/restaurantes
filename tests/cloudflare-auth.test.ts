import { test } from "node:test";
import assert from "node:assert/strict";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { configured, isAdmin, loginCookie, passwordMatches } from "../src/cloudflare/auth";
import { imageType } from "../src/cloudflare/worker";
import type { Env } from "../src/cloudflare/types";

test("Cloudflare: hash, sesión firmada, caducidad y fallo cerrado", async () => {
  const salt = randomBytes(16).toString("hex");
  const env = { INCH_CF_PASSWORD_HASH: `pbkdf2$100000$${salt}$${pbkdf2Sync("test", Buffer.from(salt, "hex"), 100000, 32, "sha256").toString("hex")}`, INCH_CF_SESSION_SECRET: randomBytes(32).toString("hex") } as Env;
  assert.equal(configured(env), true); assert.equal(await passwordMatches("test", env), true); assert.equal(await passwordMatches("other", env), false);
  const request = new Request("https://inch.test/admin");
  const cookie = await loginCookie(request, env); assert.match(cookie, /Secure/);
  const authenticated = new Request(request, { headers: { Cookie: cookie.split(";")[0] } });
  assert.equal(await isAdmin(authenticated, env), true);
  assert.equal(await isAdmin(authenticated, env, Date.now() + 9 * 3600000), false);
  const token = cookie.split(";")[0]; const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
  assert.equal(await isAdmin(new Request(request, { headers: { Cookie: tampered } }), env), false);
  assert.equal(await isAdmin(authenticated, {} as Env), false);
});
test("La carga de fotos rechaza SVG y documentos", () => {
  assert.equal(imageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
  assert.equal(imageType(new TextEncoder().encode('<html><script>alert(1)</script></html>')), null);
});
