import { readFileSync } from "fs";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Client } = pg;
const BUILDER_ID = "bld_prestige";

function loadEnv() {
  const raw = readFileSync(".env.local", "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnv();
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const hash = (pw) => bcrypt.hashSync(pw, 10);

await db.query(
  `INSERT INTO builders (id, name, slug, phone, email, support_hours, whatsapp_demo_otp, created_at, updated_at)
   VALUES ('bld_prestige','Prestige Estates','prestige','+91 80 2555 0100','care@prestige.demo','Mon–Sat 9 AM – 6 PM','482916',NOW(),NOW())
   ON CONFLICT (id) DO UPDATE SET
     name = EXCLUDED.name,
     phone = EXCLUDED.phone,
     email = EXCLUDED.email,
     support_hours = EXCLUDED.support_hours,
     whatsapp_demo_otp = EXCLUDED.whatsapp_demo_otp,
     updated_at = NOW()`
);

// Agents
const agents = [
  { id: "agent_rahul", name: "Rahul Mehta", phone: "+919900001001", rate: 2.5 },
  { id: "agent_anita", name: "Anita Desai", phone: "+919900001002", rate: 2 },
];
for (const a of agents) {
  await db.query(
    `INSERT INTO agents (id, builder_id, name, phone, whatsapp, commission_rate, employment_type, join_date, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$4,$5,'full_time',NOW(),NOW(),NOW()) ON CONFLICT (id) DO NOTHING`,
    [a.id, BUILDER_ID, a.name, a.phone, a.rate]
  );
}

// Portal users (JWT/bcrypt per PRD)
const users = [
  { id: "usr_admin", email: "admin@prestige.demo", pw: "admin123", name: "Priya Sharma", role: "super_admin", agentId: null },
  { id: "usr_sales", email: "sales@prestige.demo", pw: "sales123", name: "Rahul Mehta", role: "sales_agent", agentId: "agent_rahul" },
  { id: "usr_accounts", email: "accounts@prestige.demo", pw: "accounts123", name: "Suresh Iyer", role: "accounts", agentId: null },
  { id: "usr_docs", email: "docs@prestige.demo", pw: "docs123", name: "Anita Desai", role: "document_manager", agentId: null },
];
for (const u of users) {
  await db.query(
    `INSERT INTO portal_users (id, builder_id, email, password_hash, name, role, agent_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
     ON CONFLICT (id) DO UPDATE SET password_hash=$4, role=$6, agent_id=$7`,
    [u.id, BUILDER_ID, u.email, hash(u.pw), u.name, u.role, u.agentId]
  );
}

// Project
await db.query(
  `INSERT INTO projects (id, builder_id, name, type, location, total_units, status, construction_pct, possession_date, created_at, updated_at)
   VALUES ('proj_lakeside','bld_prestige','Prestige Lakeside Habitat','residential','Bangalore',6,'active',68,'2026-12-31',NOW(),NOW())
   ON CONFLICT (id) DO NOTHING`
);

// Clients before units (FK on units.client_id)
const clients = [
  { id: "client_vikram", name: "Vikram Patel", phone: "+919876543210", email: "vikram@email.com", unit: "4B", tower: "Tower 2", project: "Prestige Lakeside Habitat", stage: "active_buyer", agent: "agent_rahul" },
  { id: "client_sneha", name: "Sneha Reddy", phone: "+919123456789", email: "sneha@email.com", unit: "12A", tower: "Tower 1", project: "Prestige Lakeside Habitat", stage: "booked", agent: "agent_rahul" },
  { id: "client_arjun", name: "Arjun Nair", phone: "+919988776655", unit: "7C", tower: "Tower 3", project: "Prestige Suncrest", stage: "prospect", agent: "agent_anita" },
];
for (const c of clients) {
  await db.query(
    `INSERT INTO clients (id, builder_id, name, phone, email, unit, tower, project_name, stage, assigned_agent_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
     ON CONFLICT (id) DO UPDATE SET name=$3, phone=$4, stage=$9`,
    [c.id, BUILDER_ID, c.name, c.phone, c.email ?? null, c.unit, c.tower, c.project, c.stage, c.agent]
  );
}

const units = [
  { id: "unit_4b", num: "4B", floor: "4", block: "Tower 2", price: 8500000, status: "sold", client: "client_vikram" },
  { id: "unit_12a", num: "12A", floor: "12", block: "Tower 1", price: 12000000, status: "reserved", client: "client_sneha" },
  { id: "unit_7c", num: "7C", floor: "7", block: "Tower 3", price: 7200000, status: "available", client: null },
  { id: "unit_3a", num: "3A", floor: "3", block: "Tower 1", price: 6800000, status: "available", client: null },
  { id: "unit_5b", num: "5B", floor: "5", block: "Tower 2", price: 7900000, status: "available", client: null },
  { id: "unit_9a", num: "9A", floor: "9", block: "Tower 1", price: 9500000, status: "blocked", client: null },
];
for (const u of units) {
  await db.query(
    `INSERT INTO units (id, project_id, unit_number, type, floor, block, area_sqft, facing, base_price, status, client_id, agent_id, booking_date, created_at, updated_at)
     VALUES ($1,'proj_lakeside',$2,'apartment',$3,$4,1450,'east',$5,$6,$7,'agent_rahul',CASE WHEN $6='sold' THEN NOW() ELSE NULL END,NOW(),NOW())
     ON CONFLICT (id) DO NOTHING`,
    [u.id, u.num, u.floor, u.block, u.price, u.status, u.client]
  );
}

// Deal for Vikram
await db.query(
  `INSERT INTO deals (id, builder_id, client_id, unit_id, agent_id, booking_date, payment_plan_type, total_value, discount, final_price, payment_status, created_at, updated_at)
   VALUES ('deal_vikram','bld_prestige','client_vikram','unit_4b','agent_rahul','2024-10-01','milestone',8500000,0,8500000,'on_track',NOW(),NOW())
   ON CONFLICT (id) DO NOTHING`
);

const schedule = [
  { id: "pay_v1", n: 1, due: "2024-10-15", amt: 1700000, status: "paid" },
  { id: "pay_v2", n: 2, due: "2025-01-15", amt: 1700000, status: "paid" },
  { id: "pay_v3", n: 3, due: "2025-07-15", amt: 1700000, status: "upcoming" },
  { id: "pay_v4", n: 4, due: "2026-01-15", amt: 1700000, status: "upcoming" },
  { id: "pay_v5", n: 5, due: "2026-07-15", amt: 1700000, status: "upcoming" },
];
for (const p of schedule) {
  await db.query(
    `INSERT INTO payment_schedule_items (id, deal_id, installment_number, due_date, amount, milestone, status, created_at)
     VALUES ($1,'deal_vikram',$2,$3,$4,$5,$6,NOW()) ON CONFLICT (id) DO NOTHING`,
    [p.id, p.n, p.due, p.amt, `Milestone ${p.n}`, p.status]
  );
}

await db.query(
  `INSERT INTO payment_transactions (id, deal_id, schedule_item_id, amount, mode, reference, paid_at, recorded_by, created_at)
   VALUES ('txn_v1','deal_vikram','pay_v1',1700000,'bank_transfer','TXN001','2024-10-15','Suresh Iyer',NOW()),
          ('txn_v2','deal_vikram','pay_v2',1700000,'bank_transfer','TXN002','2025-01-16','Suresh Iyer',NOW())
   ON CONFLICT (id) DO NOTHING`
);

await db.query(
  `INSERT INTO commissions (id, deal_id, agent_id, deal_value, rate, amount, trigger, status, created_at)
   VALUES ('comm_vikram','deal_vikram','agent_rahul',8500000,2.5,212500,'on_booking','pending',NOW())
   ON CONFLICT (id) DO NOTHING`
);

await db.query(
  `INSERT INTO construction_milestones (id, project_id, title, progress_pct, completed_at, created_at)
   VALUES ('ms_1','proj_lakeside','Structure Complete',68,NOW(),NOW()) ON CONFLICT (id) DO NOTHING`
);

console.log("PropTrack seed complete.");
console.log("Login: admin@prestige.demo / admin123 | sales@prestige.demo / sales123");
console.log("       accounts@prestige.demo / accounts123 | docs@prestige.demo / docs123");
await db.end();
