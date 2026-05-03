#!/usr/bin/env node
// Seeds demo users for each plan so you can test login with email + password.
//
// Usage:  node scripts/seed-demo-users.js
//
// Users created (password: Test1234!):
//   free1@test.com  / free2@test.com   → free plan
//   indie1@test.com / indie2@test.com  → indie plan
//   pro1@test.com   / pro2@test.com    → pro plan

import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'puaforge',
  password: process.env.DB_PASSWORD || 'puaforge',
  database: process.env.DB_NAME || 'puaforge',
});

const PASSWORD = 'Test1234!';
const hash = await bcrypt.hash(PASSWORD, 10);

const USERS = [
  { email: 'free1@test.com',  name: 'Free User 1',  plan: 'free'  },
  { email: 'free2@test.com',  name: 'Free User 2',  plan: 'free'  },
  { email: 'indie1@test.com', name: 'Indie User 1', plan: 'indie' },
  { email: 'indie2@test.com', name: 'Indie User 2', plan: 'indie' },
  { email: 'pro1@test.com',   name: 'Pro User 1',   plan: 'pro'   },
  { email: 'pro2@test.com',   name: 'Pro User 2',   plan: 'pro'   },
];

for (const { email, name, plan } of USERS) {
  const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

  let userId;

  if (rows.length > 0) {
    userId = rows[0].id;
    await pool.query(
      "UPDATE users SET name = $1, password_hash = $2, status = 'active', role = 'user', email_verified = true WHERE id = $3",
      [name, hash, userId],
    );
    console.log(`↻ Updated  ${email}`);
  } else {
    const { rows: inserted } = await pool.query(
      `INSERT INTO users (email, name, password_hash, role, status, email_verified)
       VALUES ($1, $2, $3, 'user', 'active', true)
       RETURNING id`,
      [email, name, hash],
    );
    userId = inserted[0].id;
    console.log(`✓ Created  ${email}`);
  }

  await pool.query(
    `INSERT INTO subscriptions (user_id, plan, status)
     VALUES ($1, $2, 'active')
     ON CONFLICT (user_id) DO UPDATE SET plan = $2, status = 'active'`,
    [userId, plan],
  );

  console.log(`  └─ plan: ${plan}`);
}

console.log(`\nAll users use password: ${PASSWORD}`);

await pool.end();
