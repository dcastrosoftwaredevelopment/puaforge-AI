#!/usr/bin/env node
// Usage: node scripts/seed-superuser.js email1@example.com [email2@example.com ...]
import pg from 'pg';

const emails = process.argv.slice(2);

if (emails.length === 0) {
  console.error('Usage: node scripts/seed-superuser.js email1@example.com [email2@example.com ...]');
  process.exit(1);
}

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'puaforge',
  password: process.env.DB_PASSWORD || 'puaforge',
  database: process.env.DB_NAME || 'puaforge',
});

for (const raw of emails) {
  const email = raw.trim().toLowerCase();

  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

  if (rows.length > 0) {
    await pool.query("UPDATE users SET role = 'superuser', status = 'active' WHERE email = $1", [email]);
    console.log(`✓ Updated existing user "${email}" → role=superuser, status=active`);
  } else {
    await pool.query(
      "INSERT INTO users (email, role, status, email_verified) VALUES ($1, 'superuser', 'active', true)",
      [email],
    );
    console.log(`✓ Pre-registered "${email}" → role=superuser, status=active`);
  }
}

await pool.end();
