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
      const raw = await api.get<UserUsage>('/api/user/usage', { Authorization: `Bearer ${token}` })
      // Deserialize -1 sentinel back to Infinity
      const deserialize = (m: UsageMetric): UsageMetric => ({ used: m.used, limit: m.limit === -1 ? Infinity : m.limit })
      const result: UserUsage = {
        plan: raw.plan,
        usage: {
          projects: deserialize(raw.usage.projects),
          customDomains: deserialize(raw.usage.customDomains),
          importsThisMonth: deserialize(raw.usage.importsThisMonth),
          storageBytes: deserialize(raw.usage.storageBytes),
        },
      }
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

export interface PlanLimits {
  maxProjects: number
  maxCustomDomains: number
  maxImportsPerMonth: number
  maxStorageBytes: number
  maxCheckpointsPerProject: number
  maxPublishedSites: number
}

export type PlansConfig = Record<'free' | 'indie' | 'pro', PlanLimits>

function deserializeLimits(raw: PlanLimits): PlanLimits {
  const inf = (n: number) => (n === -1 ? Infinity : n)
  return {
    ...raw,
    maxProjects: inf(raw.maxProjects),
    maxCustomDomains: inf(raw.maxCustomDomains),
    maxImportsPerMonth: inf(raw.maxImportsPerMonth),
    maxStorageBytes: inf(raw.maxStorageBytes),
    maxCheckpointsPerProject: inf(raw.maxCheckpointsPerProject),
    maxPublishedSites: inf(raw.maxPublishedSites),
  }
}

export function usePlansConfig() {
  const [plans, setPlans] = useState<PlansConfig | null>(null)

  useEffect(() => {
    api.get<Record<string, PlanLimits>>('/api/plans')
      .then((raw) => {
        setPlans(
          Object.fromEntries(
            Object.entries(raw).map(([k, v]) => [k, deserializeLimits(v)]),
          ) as PlansConfig,
        )
      })
      .catch(() => {})
  }, [])

  return plans
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
