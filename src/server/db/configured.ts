/** Env check only — safe to import from Server Components without loading `pg`. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
