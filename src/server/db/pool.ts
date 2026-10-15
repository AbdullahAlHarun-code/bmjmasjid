import mysql, { type Pool, type PoolConnection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";
import { createHash } from "node:crypto";
import { isDatabaseConfigured } from "./configured";

export { isDatabaseConfigured };
let pool: Pool | null = null;
type SqlValue = string | number | boolean | null;
export type QueryResult<T> = { rows: T[]; rowCount: number };
export type SqlClient = { query<T extends object = Record<string, unknown>>(text: string, params?: SqlValue[]): Promise<QueryResult<T>> };

export function getPool(): Pool {
  if (!isDatabaseConfigured()) throw new Error("MySQL DATABASE_URL is not configured");
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL!, connectionLimit: 5, connectTimeout: 8_000,
      waitForConnections: true, queueLimit: 20,
      charset: "utf8mb4", timezone: "Z", dateStrings: true,
      supportBigNumbers: true, bigNumberStrings: true,
      // TLS is opt-in for remote databases and always verifies the server.
      ...(process.env.DATABASE_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}),
    });
  }
  return pool;
}

function adapter(connection: Pool | PoolConnection): SqlClient {
  return { async query<T extends object>(text: string, params: SqlValue[] = []) {
    const [result] = await connection.execute<RowDataPacket[] | ResultSetHeader>(text, params);
    return Array.isArray(result)
      ? { rows: result as T[], rowCount: result.length }
      : { rows: [] as T[], rowCount: result.affectedRows };
  } };
}
export async function query<T extends object = Record<string, unknown>>(text: string, params?: SqlValue[]): Promise<QueryResult<T>> {
  return adapter(getPool()).query<T>(text, params);
}

export async function withTransaction<T>(fn: (client: SqlClient) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    // Rechecks after a contended lock must see the preceding transaction's commit.
    await connection.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    await connection.beginTransaction();
    const result = await fn(adapter(connection));
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}

/** InnoDB row lock, released at transaction commit/rollback; no special server privilege. */
export async function lockReportKey(client: SqlClient, key: string): Promise<void> {
  const hash = createHash("sha256").update(key).digest("hex");
  await client.query("INSERT INTO donation_report_locks (lock_key) VALUES (?) ON DUPLICATE KEY UPDATE lock_key=lock_key", [hash]);
  await client.query("SELECT lock_key FROM donation_report_locks WHERE lock_key=? FOR UPDATE", [hash]);
}
