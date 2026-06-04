/**
 * One-time: add password_hash to portal_users (from legacy `password` column).
 * Run before `npm run db:push` if push fails on password_hash.
 */
import { readFileSync } from "fs";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Client } = pg;

function loadEnv() {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const DEMO = {
  "admin@prestige.demo": "admin123",
  "sales@prestige.demo": "sales123",
  "accounts@prestige.demo": "accounts123",
  "docs@prestige.demo": "docs123",
};

loadEnv();
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const cols = await db.query(
  `SELECT column_name FROM information_schema.columns
   WHERE table_name = 'portal_users' AND table_schema = 'public'`
);
const names = new Set(cols.rows.map((r) => r.column_name));

if (!names.has("password_hash")) {
  await db.query(`ALTER TABLE portal_users ADD COLUMN password_hash TEXT`);
  console.log("Added password_hash column");
}

const users = await db.query(`SELECT id, email, password FROM portal_users`);
for (const row of users.rows) {
  const plain =
    row.password ??
    DEMO[row.email] ??
    null;
  if (!plain) {
    console.warn(`Skip ${row.email}: no password source`);
    continue;
  }
  const hash = bcrypt.hashSync(plain, 10);
  await db.query(`UPDATE portal_users SET password_hash = $1 WHERE id = $2`, [
    hash,
    row.id,
  ]);
  console.log(`Hashed password for ${row.email}`);
}

await db.query(
  `UPDATE portal_users SET password_hash = $1 WHERE password_hash IS NULL`,
  [bcrypt.hashSync("changeme", 10)]
);

if (names.has("password")) {
  await db.query(`ALTER TABLE portal_users DROP COLUMN password`);
  console.log("Dropped legacy password column");
}

await db.end();
console.log("Done. Run: npm run db:push && npm run db:seed-all");
