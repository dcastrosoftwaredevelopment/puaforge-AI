#!/usr/bin/env node
// One-shot script to manually apply migrations 0010 and 0011 when Drizzle
// auto-migration fails to detect them. Safe to re-run (all statements are idempotent).
import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'postgres',
});

async function run(label, sql) {
  try {
    await pool.query(sql);
    console.log('✓', label);
  } catch (e) {
    console.error('✗', label, '-', e.message);
  }
}

// 0010
await run('last_verification_email_sent_at', `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_verification_email_sent_at timestamp`);

// 0011
await run('role', `ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'user'`);
await run('status', `ALTER TABLE users ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'active'`);
await run('teams table', `CREATE TABLE IF NOT EXISTS teams (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, name varchar(255) NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`);
await run('team_members table', `CREATE TABLE IF NOT EXISTS team_members (team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, joined_at timestamp DEFAULT now() NOT NULL, PRIMARY KEY (team_id, user_id))`);
await run('project_teams table', `CREATE TABLE IF NOT EXISTS project_teams (project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE, shared_at timestamp DEFAULT now() NOT NULL, PRIMARY KEY (project_id, team_id))`);

await pool.end();
console.log('done');
