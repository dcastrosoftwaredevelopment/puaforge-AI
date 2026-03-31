import type { pt } from './pt'

type DeepString<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown> ? DeepString<T[K]> : string
}

export type Translations = DeepString<typeof pt>
