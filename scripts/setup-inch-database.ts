import { readFile } from "node:fs/promises";
import { inchDatabase } from "../src/lib/inch-database";
import { initialDraft } from "../src/lib/inch-draft";
async function main() {
 const database = inchDatabase();
 try {
  await database.query(await readFile("netlify/database/migrations/001_inch_drafts.sql", "utf8"));
  await database.query("INSERT INTO inch_menu_drafts (menu_id, dishes) VALUES ($1, $2::jsonb) ON CONFLICT (menu_id) DO NOTHING", ["inch", JSON.stringify(initialDraft)]);
  console.log("Esquema INCH preparado. Los borradores existentes y la carta pública se conservan.");
 } catch {
  console.error("No se pudo preparar el esquema INCH. Revisa la configuración privada."); process.exitCode = 1;
 } finally { await database.end(); }
}
main().catch(() => { console.error("Falta configuración privada de la base INCH."); process.exitCode = 1; });
