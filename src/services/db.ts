import Dexie, { type EntityTable } from 'dexie'

// Schema interfaces
export interface DbProject {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

export interface DbMessage {
  id: string
  projectId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface DbProjectFile {
  id?: number
  projectId: string
  path: string
  code: string
  updatedAt: number
}

export interface DbProjectImage {
  id: string
  projectId: string
  name: string
  dataUrl: string
  mediaType: string
  size: number
}

export interface DbSetting {
  key: string
  value: string
}

// Database definition
const DB_NAME = 'vibe-platform'
const DB_VERSION = 4

const db = new Dexie(DB_NAME) as Dexie & {
  projects: EntityTable<DbProject, 'id'>
  messages: EntityTable<DbMessage, 'id'>
  projectFiles: EntityTable<DbProjectFile, 'id'>
  projectImages: EntityTable<DbProjectImage, 'id'>
  settings: EntityTable<DbSetting, 'key'>
}

db.version(DB_VERSION).stores({
  projects: 'id, createdAt, updatedAt',
  messages: 'id, projectId, timestamp',
  projectFiles: '++id, [projectId+path], projectId',
  projectImages: 'id, projectId',
  settings: 'key',
})

// Force-delete old incompatible DB (v1/v2 had different primary keys)
async function ensureCleanDb() {
  try {
    await db.open()
  } catch (e) {
    if (e instanceof Dexie.DexieError && e.name === 'UpgradeError') {
      console.warn('[db] Incompatible schema detected, resetting database...')
      await Dexie.delete(DB_NAME)
      await db.open()
    } else {
      throw e
    }
  }
}

const dbReady = ensureCleanDb()

export { db, dbReady }
