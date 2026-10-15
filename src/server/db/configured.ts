/** Env check only — safe for Server Components without loading the database driver. */
export function isDatabaseConfigured(): boolean {
  try { return new URL(process.env.DATABASE_URL?.trim() ?? "").protocol === "mysql:"; }
  catch { return false; }
}
