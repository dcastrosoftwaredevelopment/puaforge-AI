import { useEffect, useState, useCallback } from 'react'
import { useAtomValue } from 'jotai'
import { authTokenAtom } from '@/atoms/authAtoms'
import { api } from '@/services/api'

export type Plan = 'free' | 'indie' | 'pro'

export interface UsageMetric {
  used: number
  limit: number // Infinity = unlimited
}

export interface Usage {
  projects: UsageMetric
  customDomains: UsageMetric
  importsThisMonth: UsageMetric
  storageBytes: UsageMetric
}

export interface UserUsage {
  plan: Plan
  usage: Usage
}

export function useUsage() {
  const token = useAtomValue(authTokenAtom)
  const [data, setData] = useState<UserUsage | null>(null)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const result = await api.get<UserUsage>('/api/user/usage', { Authorization: `Bearer ${token}` })
      setData(result)
    } catch {
      // non-critical
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { void fetch() }, [fetch])

  return { data, loading, refetch: fetch }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function formatLimit(limit: number, unit?: string): string {
  if (limit === Infinity || limit >= 1e9) return '∞'
  if (unit === 'bytes') return formatBytes(limit)
  return String(limit)
}
