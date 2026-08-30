#!/usr/bin/env node
/**
 * Keep-alive ping for Neon DB.
 * Runs SELECT 1 to prevent the database from going to sleep.
 * Usage: node scripts/keepalive-neon.js <connection_string>
 */
const { Client } = require("pg");

const rawConnStr = process.argv[2];
if (!rawConnStr) {
  console.error("Usage: node keepalive-neon.js <connection_string>");
  process.exit(1);
}

// Strip channel_binding param (not supported by pg client)
const connStr = rawConnStr.replace(/[&?]channel_binding=require/, "");

const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function ping() {
  try {
    await client.connect();
    const res = await client.query("SELECT 1 AS ok");
    console.log(`[${new Date().toISOString()}] Neon ping OK: ${JSON.stringify(res.rows)}`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Neon ping FAILED: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

ping();
