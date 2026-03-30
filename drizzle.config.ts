import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/schema.ts',
  out: './server/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'puaforge',
    password: process.env.DB_PASSWORD || 'puaforge',
    database: process.env.DB_NAME || 'puaforge',
  },
})
