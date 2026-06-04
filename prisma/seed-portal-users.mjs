import { readFileSync } from "fs";
import pg from "pg";

const { Client } = pg;

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
  } catch {
    console.error("Missing .env.local with DATABASE_URL");
    process.exit(1);
  }
}

loadEnv();

const users = [
  {
    id: "usr_admin",
    builder_id: "bld_prestige",
    email: "admin@prestige.demo",
    password: "admin123",
    name: "Priya Sharma",
    role: "admin",
  },
  {
    id: "usr_sales",
    builder_id: "bld_prestige",
    email: "sales@prestige.demo",
    password: "sales123",
    name: "Rahul Mehta",
    role: "sales",
  },
  {
    id: "usr_docs",
    builder_id: "bld_prestige",
    email: "docs@prestige.demo",
    password: "docs123",
    name: "Anita Desai",
    role: "document_manager",
  },
];

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

for (const u of users) {
  await client.query(
    `INSERT INTO portal_users (id, builder_id, email, password, name, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       password = EXCLUDED.password,
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       updated_at = NOW()`,
    [u.id, u.builder_id, u.email, u.password, u.name, u.role]
  );
}

const count = await client.query("SELECT COUNT(*)::int AS n FROM portal_users");
console.log(`Portal users in Neon: ${count.rows[0].n}`);
await client.end();
