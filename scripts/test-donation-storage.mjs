/** HTTP integration checks against a built app and an explicitly disposable DB. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import mysql from 'mysql2/promise';

const database = process.env.DONATION_TEST_DATABASE_URL;
if (!database || new URL(database).protocol !== 'mysql:' || new URL(database).pathname !== '/donation_test') {
  throw new Error('Explicit disposable DONATION_TEST_DATABASE_URL ending in /donation_test required.');
}
const driver = mysql.createPool({ uri: database, dateStrings: true, supportBigNumbers: true, bigNumberStrings: true, charset: 'utf8mb4' });
const pool = {
  async query(sql, params = []) { const [rows] = await driver.execute(sql, params); return { rows, rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows }; },
  end: () => driver.end(),
};
const existing = await pool.query('SELECT count(*) FROM donation_report_submissions');
assert.equal(Number(existing.rows[0].count), 0, 'Refuse to test a database containing submissions');
const port = '3127';
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', port], {
  env: { ...process.env, DATABASE_URL: database, CSRF_SECRET: randomUUID() + randomUUID(), APP_ORIGIN: origin },
  stdio: ['ignore', 'ignore', 'inherit'],
});
const stopped = once(child, 'exit');
const marker = `TEST-${randomUUID()}`;
let checks = 0;
function passed(label) { checks++; console.log(`PASS ${label}`); }
async function resetLimits() { await pool.query('DELETE FROM request_rate_limits'); }
try {
  let csrfResponse;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { csrfResponse = await fetch(`${origin}/api/donation-reports/csrf`); if (csrfResponse.ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(csrfResponse?.ok, 'App did not become ready');
  const token = (await csrfResponse.json()).token;
  const cookie = csrfResponse.headers.get('set-cookie').split(';')[0];
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const input = { amount: '১০০০.২৫', trxId: marker, transferDate: today, donorName: 'পরীক্ষা TEST' };
  async function post(body = input, key = randomUUID(), extra = {}) {
    const response = await fetch(`${origin}/api/donation-reports`, {
      method: 'POST', headers: { origin, cookie, 'content-type': 'application/json', 'x-csrf-token': token, 'idempotency-key': key, ...extra },
      body: JSON.stringify(body),
    });
    return { status: response.status, data: await response.json(), headers: response.headers };
  }
  assert.equal((await post(input, randomUUID(), { origin: 'https://other.example' })).status, 403);
  assert.equal((await post(input, randomUUID(), { 'x-csrf-token': 'bad' })).status, 403);
  passed('origin and CSRF rejection');
  for (const bad of [null, [], { ...input, amount: 100 }, { ...input, donorName: {} }, { ...input, transferDate: '2026-02-30' }, { ...input, transferDate: '2999-01-01' }, { ...input, amount: '1.001' }]) {
    const result = await post(bad);
    assert.equal(result.status, 400, JSON.stringify(result.data));
  }
  passed('malformed field types, impossible dates, future dates and fractional poisha');
  await resetLimits();
  const key = randomUUID();
  const responses = await Promise.all([post(input, key), post(input, key)]);
  assert.ok(responses.every(r => r.status === 200));
  assert.equal(responses[0].data.publicRef, responses[1].data.publicRef);
  const ref = responses[0].data.publicRef;
  const stored = await pool.query('SELECT * FROM donation_report_submissions WHERE public_ref=?', [ref]);
  assert.equal(stored.rowCount, 1);
  assert.equal(stored.rows[0].claimed_amount_poisha, '100025');
  assert.equal(stored.rows[0].status, 'pending_review');
  assert.equal(stored.rows[0].verified_amount_poisha, null);
  passed('commit persistence, Bangla amount, current transfer date and concurrent retry');
  assert.equal((await post({ ...input, amount: '2' }, key)).status, 409);
  assert.equal((await post(input, key)).data.publicRef, ref);
  passed('changed retry rejected without overwriting original');
  const duplicates = await Promise.all([post(), post()]);
  assert.ok(duplicates.every(r => r.status === 200 && r.data.status === 'duplicate_claim'));
  const rows = await pool.query('SELECT * FROM donation_report_submissions WHERE trx_id_normalized=?', [marker.toUpperCase()]);
  assert.equal(rows.rowCount, 3);
  const total = await pool.query("SELECT CAST(coalesce(sum(verified_amount_poisha),0) AS CHAR) AS total FROM donation_report_submissions WHERE status='verified'");
  assert.equal(total.rows[0].total, '0');
  passed('concurrent duplicate review and pending exclusion from verified totals');
  await pool.query("UPDATE donation_report_submissions SET status='verified', verified_amount_poisha=100025 WHERE public_ref=?", [ref]);
  await assert.rejects(pool.query("UPDATE donation_report_submissions SET status='verified', verified_amount_poisha=100025 WHERE public_ref=?", [duplicates[0].data.publicRef]), { code: 'ER_DUP_ENTRY' });
  passed('database prevents verifying a transfer twice');
  await resetLimits();
  for (let i = 0; i < 8; i++) assert.equal((await post(input, key)).status, 200);
  const limited = await post(input, key);
  assert.equal(limited.status, 429); assert.ok(Number(limited.headers.get('retry-after')) > 0);
  passed('persistent rate limit and retry-after');
  await resetLimits();
  assert.equal((await post({ ...input, message: 'x'.repeat(9000) })).status, 413);
  passed('oversized request rejected');
  // Real write failure while reads/rate-limit table remain available. Always restore.
  await pool.query('ALTER TABLE donation_report_submissions RENAME TO donation_report_submissions_failure_test');
  try {
    const failed = await post(input);
    assert.equal(failed.status, 503); assert.equal(failed.data.ok, false); assert.equal(failed.data.publicRef, undefined);
  } finally {
    await pool.query('ALTER TABLE donation_report_submissions_failure_test RENAME TO donation_report_submissions');
  }
  passed('database save failure never acknowledges success');
  console.log(`${checks} MySQL/MariaDB HTTP integration groups passed.`);
} finally {
  child.kill('SIGTERM');
  await stopped;
  await pool.query('DELETE FROM donation_report_submissions WHERE trx_id_normalized=?', [marker.toUpperCase()]);
  await resetLimits();
  await pool.query('DELETE FROM donation_report_locks');
  const remaining = await pool.query('SELECT count(*) FROM donation_report_submissions');
  assert.equal(Number(remaining.rows[0].count), 0, 'Test data cleanup');
  await pool.end();
}
