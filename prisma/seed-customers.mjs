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

const customers = [
  {
    id: "cust_001",
    builder_id: "bld_prestige",
    name: "Vikram Patel",
    phone: "+919876543210",
    email: "vikram.patel@email.com",
    unit: "4B",
    tower: "Tower 2",
    project: "Prestige Lakeside Habitat",
  },
  {
    id: "cust_002",
    builder_id: "bld_prestige",
    name: "Sneha Reddy",
    phone: "+919123456789",
    email: "sneha.reddy@email.com",
    unit: "12A",
    tower: "Tower 1",
    project: "Prestige Lakeside Habitat",
  },
  {
    id: "cust_003",
    builder_id: "bld_prestige",
    name: "Arjun Nair",
    phone: "+919988776655",
    email: null,
    unit: "7C",
    tower: "Tower 3",
    project: "Prestige Suncrest",
  },
];

const client = new Client({ connectionString: process.env.DATABASE_URL });

await client.connect();

for (const c of customers) {
  await client.query(
    `INSERT INTO customers (id, builder_id, name, phone, email, unit, tower, project, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [
      c.id,
      c.builder_id,
      c.name,
      c.phone,
      c.email,
      c.unit,
      c.tower,
      c.project,
    ]
  );
}

const count = await client.query("SELECT COUNT(*)::int AS n FROM customers");
console.log(`Customers in Neon: ${count.rows[0].n}`);
await client.end();
