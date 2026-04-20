import { useAtom } from 'jotai'
import { upgradePromptAtom, type UpgradePrompt } from '@/atoms'

export function useUpgradeModal() {
  const [prompt, setPrompt] = useAtom(upgradePromptAtom)
  return { prompt, setPrompt, close: () => setPrompt(null) }
}

export type { UpgradePrompt }
