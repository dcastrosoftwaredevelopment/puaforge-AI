import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'puaforge',
  password: process.env.DB_PASSWORD || 'puaforge',
  database: process.env.DB_NAME || 'puaforge',
})

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      password_hash VARCHAR(255),
      google_id VARCHAR(255) UNIQUE,
      api_key TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)
}
