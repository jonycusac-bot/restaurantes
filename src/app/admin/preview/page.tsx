import type { Metadata } from "next";
import AdminPreview from "./AdminPreview";
import "./admin.css";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { sessionCookie, validSession } from "../../../lib/admin-auth";
import LoginForm from "../LoginForm";

export const metadata: Metadata = { title: "INCH · Vista previa del panel", robots: { index: false, follow: false } };

export default function AdminPreviewPage() {
  return <Suspense fallback={<p>Cargando panel…</p>}><ProtectedPanel /></Suspense>;
}

async function ProtectedPanel() {
  // Session expiry must be checked against the time of the actual request.
  await connection();
  const store = await cookies();
  return validSession(store.get(sessionCookie)?.value) ? <AdminPreview /> : <LoginForm />;
}
