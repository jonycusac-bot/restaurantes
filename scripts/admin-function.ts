import { authAction, cookieFromRequest, validSession } from "../src/lib/admin-auth";
import { handleDraftRequest } from "../src/lib/admin-draft-api";
import { inchDatabase, postgresDraftStore } from "../src/lib/inch-database";
// Generated at build time; kept outside the public directory.
import { adminHtml, loginHtml } from "../.netlify/inch-html.mjs";
export default async function handler(request: Request) {
  const path = new URL(request.url).pathname;
  if (path === "/api/admin/login" || path === "/api/admin/logout") return authAction(request);
  if (path === "/api/admin/draft") return handleDraftRequest(request, () => postgresDraftStore(inchDatabase()));
  if (!["/admin", "/admin/", "/admin/preview", "/admin/preview/"].includes(path)) return new Response("No encontrado", { status: 404 });
  if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405 });
  return new Response(request.method === "HEAD" ? null : validSession(cookieFromRequest(request)) ? adminHtml : loginHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "X-Frame-Options": "DENY", "X-Content-Type-Options": "nosniff" },
  });
}
export const config = { path: ["/admin", "/admin/*", "/api/admin/*"], rateLimit: { windowSize: 60, windowLimit: 20, aggregateBy: ["ip", "domain"] } };
