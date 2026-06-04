import { readFileSync } from "fs";
import pg from "pg";

function loadEnv() {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnv();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const r = await client.query(
  `SELECT id, email FROM portal_users WHERE email = $1 AND password = $2`,
  ["docs@prestige.demo", "docs123"]
);
console.log("DB users match:", r.rows.length, r.rows[0]?.email ?? "none");
await client.end();
