import Dexie, { type EntityTable } from 'dexie'

// Schema interfaces
export interface DbMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface DbProjectFile {
  path: string
  code: string
  updatedAt: number
}

export interface DbSetting {
  key: string
  value: string
}

// Database definition
const db = new Dexie('vibe-platform') as Dexie & {
  messages: EntityTable<DbMessage, 'id'>
  projectFiles: EntityTable<DbProjectFile, 'path'>
  settings: EntityTable<DbSetting, 'key'>
}

db.version(1).stores({
  messages: 'id, timestamp',
  projectFiles: 'path',
  settings: 'key',
})

export { db }
