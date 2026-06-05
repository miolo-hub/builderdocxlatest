/**
 * Deletes all clients and related data; resets linked units to available.
 * Usage: node prisma/clear-clients.mjs
 */
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

const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

try {
  await db.query("BEGIN");

  const { rows: clientRows } = await db.query(`SELECT COUNT(*)::int AS n FROM clients`);
  const clientCount = clientRows[0].n;

  await db.query(`
    DELETE FROM payment_transactions
    WHERE deal_id IN (SELECT id FROM deals)
  `);
  await db.query(`
    DELETE FROM payment_schedule_items
    WHERE deal_id IN (SELECT id FROM deals)
  `);
  await db.query(`
    DELETE FROM commissions
    WHERE deal_id IN (SELECT id FROM deals)
  `);
  const deals = await db.query(`DELETE FROM deals RETURNING id`);
  await db.query(`
    UPDATE units
    SET client_id = NULL,
        status = 'available',
        booking_date = NULL,
        final_price = NULL,
        agent_id = NULL
    WHERE client_id IS NOT NULL
       OR status IN ('sold', 'reserved')
  `);
  const docs = await db.query(`DELETE FROM documents RETURNING id`);
  const wa = await db.query(`DELETE FROM whatsapp_logs RETURNING id`);
  const acts = await db.query(
    `DELETE FROM activity_logs WHERE client_id IS NOT NULL RETURNING id`
  );
  await db.query(`UPDATE clients SET preferred_unit_id = NULL`);
  const removed = await db.query(`DELETE FROM clients RETURNING id`);

  await db.query("COMMIT");

  console.log("Done.");
  console.log(`  Clients deleted: ${removed.rowCount} (was ${clientCount})`);
  console.log(`  Deals deleted: ${deals.rowCount}`);
  console.log(`  Documents deleted: ${docs.rowCount}`);
  console.log(`  WhatsApp logs deleted: ${wa.rowCount}`);
  console.log(`  Activity logs deleted: ${acts.rowCount}`);
  console.log("  Units reset to available where they were sold/reserved or linked.");
} catch (err) {
  await db.query("ROLLBACK");
  console.error("Failed:", err);
  process.exit(1);
} finally {
  await db.end();
}
