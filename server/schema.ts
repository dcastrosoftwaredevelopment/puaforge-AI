import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  googleId: varchar('google_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  apiKey: text('api_key'),
  apiKeyEnabled: boolean('api_key_enabled').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  palette: jsonb('palette').$type<{ id: string; name: string; value: string; locked?: boolean }[]>(),
  customDomain: varchar('custom_domain', { length: 255 }),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  images: jsonb('images'),
  createdAt: timestamp('created_at').notNull(),
})

export const projectFiles = pgTable('project_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  code: text('code').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const projectImages = pgTable('project_images', {
  id: uuid('id').primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  mediaType: varchar('media_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),
})

export const checkpoints = pgTable('checkpoints', {
  id: uuid('id').primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  files: jsonb('files').$type<Record<string, string>>().notNull(),
  createdAt: timestamp('created_at').notNull(),
})

export const publishedSites = pgTable('published_sites', {
  projectId: uuid('project_id').primaryKey().references(() => projects.id, { onDelete: 'cascade' }),
  pbRecordId: varchar('pb_record_id', { length: 255 }).notNull(), // PocketBase record ID
  publishedAt: timestamp('published_at').notNull(),
})

export const subscriptions = pgTable('subscriptions', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  plan: varchar('plan', { length: 20 }).notNull().default('free'), // 'free' | 'indie' | 'pro'
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active' | 'canceled' | 'past_due'
  currentPeriodEnd: timestamp('current_period_end'), // null for free
  importsThisMonth: integer('imports_this_month').notNull().default(0),
  importsResetAt: timestamp('imports_reset_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type UserSettings = typeof userSettings.$inferSelect
export type Project = typeof projects.$inferSelect
export type Message = typeof messages.$inferSelect
export type ProjectFile = typeof projectFiles.$inferSelect
export type ProjectImage = typeof projectImages.$inferSelect
export type Checkpoint = typeof checkpoints.$inferSelect
export type PublishedSite = typeof publishedSites.$inferSelect
export type Subscription = typeof subscriptions.$inferSelect
