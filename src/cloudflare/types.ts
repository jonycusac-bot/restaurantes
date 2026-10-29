export interface Statement {
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface Database {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<{ meta: { changes: number } }[]>;
}
export interface Env {
  DB: Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
  INCH_CF_PASSWORD_HASH?: string;
  INCH_CF_SESSION_SECRET?: string;
}
