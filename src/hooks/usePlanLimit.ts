import { useSetAtom } from 'jotai'
import { upgradePromptAtom } from '@/atoms'
import { PlanLimitError } from '@/services/api'

/**
 * Returns a helper that wraps any async call and automatically opens the
 * upgrade modal if the server returns a plan limit error (403 upgradeRequired).
 *
 * Usage:
 *   const withPlanLimit = usePlanLimit()
 *   await withPlanLimit(() => api.post(...))
 */
export function usePlanLimit() {
  const setUpgradePrompt = useSetAtom(upgradePromptAtom)

  return async function withPlanLimit<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn()
    } catch (err) {
      if (err instanceof PlanLimitError) {
        setUpgradePrompt({
          requiredPlan: err.requiredPlan,
          limitType: err.limitType,
          message: err.message,
        })
        return null
      }
      throw err
    }
  }
}
