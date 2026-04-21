import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { upgradePromptAtom } from '@/atoms';
import { PlanLimitError } from '@/services/api';

/** Thrown after opening the upgrade modal so callers can also show inline errors */
export class PlanLimitUIError extends Error {
  constructor(public readonly original: PlanLimitError) {
    super('plan_limit');
  }
}

/**
 * Returns a stable helper that wraps any async call and opens the upgrade modal if
 * the server returns a plan limit error (403 upgradeRequired). Also re-throws
 * a PlanLimitUIError so callers can show an inline error alongside the modal.
 *
 * Usage:
 *   const withPlanLimit = usePlanLimit()
 *   await withPlanLimit(() => api.post(...))
 */
export function usePlanLimit() {
  const setUpgradePrompt = useSetAtom(upgradePromptAtom);

  return useCallback(async function withPlanLimit<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof PlanLimitError) {
        setUpgradePrompt({
          requiredPlan: err.requiredPlan,
          limitType: err.limitType,
          message: '', // resolved in the modal via i18n
        });
        throw new PlanLimitUIError(err);
      }
      throw err;
    }
  }, [setUpgradePrompt]);
}
