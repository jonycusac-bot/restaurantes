import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, scryptSync } from "node:crypto";
import { authAction, passwordMatches, validSession } from "../src/lib/admin-auth";
import { imageDimensions } from "../src/lib/prepare-dish-image";

test("contraseña y sesión: acceso correcto, rechazo de manipulación, caducidad y cierre", async () => {
  const originalHash = process.env.INCH_ADMIN_PASSWORD_HASH;
  const originalKey = process.env.INCH_ADMIN_SESSION_SECRET;
  const salt = randomBytes(16).toString("hex");
  process.env.INCH_ADMIN_PASSWORD_HASH = `${salt}:${scryptSync("test-password", salt, 64).toString("hex")}`;
  process.env.INCH_ADMIN_SESSION_SECRET = randomBytes(32).toString("hex");
  try {
    assert.equal(passwordMatches("incorrecta"), false);
    assert.equal(passwordMatches("test-password"), true);
    const request = (path: string, password: string, origin = "https://inch.test") => new Request(`https://inch.test/api/admin/${path}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    assert.equal((await authAction(request("login", "incorrecta"))).status, 401);
    assert.equal((await authAction(request("login", "test-password", "https://otro.test"))).status, 403);
    const result = await authAction(request("login", "test-password"));
    assert.equal(result.status, 200);
    const cookie = result.headers.get("set-cookie")!;
    assert.match(cookie, /HttpOnly; SameSite=Strict/); assert.match(cookie, /Secure/);
    const token = cookie.split(";")[0].split("=")[1];
    assert.equal(validSession(token), true);
    assert.equal(validSession(token.slice(0, -1) + (token.endsWith("a") ? "b" : "a")), false);
    assert.equal(validSession(token, Date.now() + 9 * 3600 * 1000), false);
    assert.match((await authAction(request("logout", ""))).headers.get("set-cookie")!, /Max-Age=0/);
    delete process.env.INCH_ADMIN_SESSION_SECRET;
    assert.equal(validSession(token), false);
    assert.equal((await authAction(request("login", "test-password"))).status, 503);
  } finally {
    if (originalHash) process.env.INCH_ADMIN_PASSWORD_HASH = originalHash; else delete process.env.INCH_ADMIN_PASSWORD_HASH;
    if (originalKey) process.env.INCH_ADMIN_SESSION_SECRET = originalKey; else delete process.env.INCH_ADMIN_SESSION_SECRET;
  }
});

test("las fotos conservan proporciones y las pequeñas no se amplían", () => {
  assert.deepEqual(imageDimensions(4000, 3000), { width: 1600, height: 1200 });
  assert.deepEqual(imageDimensions(3000, 4000), { width: 1200, height: 1600 });
  assert.deepEqual(imageDimensions(400, 300), { width: 400, height: 300 });
});
