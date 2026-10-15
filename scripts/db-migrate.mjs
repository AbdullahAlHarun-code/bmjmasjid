/** MySQL/MariaDB DDL auto-commits; each migration must be safely repeatable. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL?.trim();
if (!url || new URL(url).protocol !== 'mysql:') {
  console.error('Set a private mysql:// DATABASE_URL in .env.local or the server environment.');
  process.exit(1);
}
const dir = path.join(process.cwd(), 'db', 'migrations', 'mysql');
const client = await mysql.createConnection({ uri: url, charset: 'utf8mb4', ...(process.env.DATABASE_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}) });
let locked = false;
try {
  const [lock] = await client.execute("SELECT GET_LOCK('bm_donation_migrations', 30) AS acquired");
  if (Number(lock[0].acquired) !== 1) throw new Error('Migration lock unavailable');
  locked = true;
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id VARCHAR(190) NOT NULL PRIMARY KEY,
    digest CHAR(64) NOT NULL,
    applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`);
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    const digest = createHash('sha256').update(sql).digest('hex');
    const [applied] = await client.execute('SELECT digest FROM schema_migrations WHERE id=?', [file]);
    if (applied.length) {
      if (applied[0].digest !== digest) throw new Error(`Applied migration changed: ${file}`);
      console.log('skip', file); continue;
    }
    // Migration files contain simple DDL only, without procedures or semicolons inside values.
    const statements = sql.replace(/^\s*--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
    for (const statement of statements) await client.query(statement);
    await client.execute('INSERT INTO schema_migrations (id,digest) VALUES (?,?)', [file, digest]);
    console.log('applied', file);
  }
} finally {
  if (locked) await client.query("SELECT RELEASE_LOCK('bm_donation_migrations')");
  await client.end();
}
