import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'path'
import { fileURLToPath } from 'url'
import * as schema from './schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'puaforge',
  password: process.env.DB_PASSWORD || 'puaforge',
  database: process.env.DB_NAME || 'puaforge',
})

export const db = drizzle(pool, { schema })

export async function runMigrations() {
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, '../server/migrations'),
    migrationsSchema: 'public',
  })
}
