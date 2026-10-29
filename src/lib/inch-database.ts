import { Pool } from "pg";
import { config } from "dotenv";
import type { CloudDraft } from "./cloud-draft";
import { parseCloudDishes } from "./cloud-draft";
import type { AdminDish } from "./inch-draft";

if (process.env.NODE_ENV !== "production") config({ path: ".env.inch-db.local", quiet: true });
let pool: Pool | undefined;
export function inchDatabase() {
  const connectionString = process.env.INCH_DATABASE_URL ?? process.env.NETLIFY_DB_URL;
  if (!connectionString) throw new Error("INCH_DATABASE_NOT_CONFIGURED");
  return pool ??= new Pool({ connectionString, max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 15000, query_timeout: 15000, allowExitOnIdle: true });
}

export interface DraftStore {
  read(): Promise<CloudDraft>;
  save(dishes: AdminDish[], revision: number): Promise<CloudDraft | null>;
}
type DraftRow = { dishes: unknown; revision: number; updated_at: Date };
function snapshot(row: DraftRow): CloudDraft {
  const dishes = parseCloudDishes(row.dishes);
  if (!dishes) throw new Error("INCH_INVALID_STORED_DRAFT");
  return { dishes, revision: row.revision, updatedAt: row.updated_at.toISOString() };
}
export function postgresDraftStore(database: Pick<Pool, "query">, menuId = "inch"): DraftStore {
  return {
    async read() {
      const result = await database.query<DraftRow>("SELECT dishes, revision, updated_at FROM inch_menu_drafts WHERE menu_id = $1", [menuId]);
      if (!result.rows[0]) throw new Error("INCH_DRAFT_NOT_INITIALIZED");
      return snapshot(result.rows[0]);
    },
    async save(dishes, revision) {
      const result = await database.query<DraftRow>("UPDATE inch_menu_drafts SET dishes = $1::jsonb, revision = revision + 1, updated_at = clock_timestamp() WHERE menu_id = $2 AND revision = $3 RETURNING dishes, revision, updated_at", [JSON.stringify(dishes), menuId, revision]);
      return result.rows[0] ? snapshot(result.rows[0]) : null;
    },
  };
}
