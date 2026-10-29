"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Also rendered as standalone HTML on Netlify. */
import { useState, type FormEvent } from "react";
export default function LoginForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const password = new FormData(event.currentTarget).get("password");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (response.ok) window.location.reload();
      else { const data = await response.json().catch(() => ({})); setMessage(data.error ?? "No se pudo acceder. Inténtalo más tarde."); }
    } catch { setMessage("No se pudo conectar con el servidor."); }
    finally { setBusy(false); }
  }
  return <main className="admin-preview"><section className="admin-editor" style={{ maxWidth: 420, margin: "10vh auto" }}><p>INCH · ADMINISTRACIÓN</p><h1>Acceso privado</h1><form onSubmit={login}><label>Contraseña<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label><button disabled={busy} type="submit">{busy ? "Entrando…" : "Entrar"}</button><p role="status">{message}</p></form><a href="/">Volver a la carta</a></section></main>;
}
