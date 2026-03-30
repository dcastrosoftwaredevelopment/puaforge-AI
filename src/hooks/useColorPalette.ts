import { useCallback } from 'react'
import { useAtom } from 'jotai'
import { colorPaletteAtom, DEFAULT_PALETTE, type PaletteColor } from '@/atoms'

export function useColorPalette() {
  const [palette, setPalette] = useAtom(colorPaletteAtom)

  const addColor = useCallback((color: Omit<PaletteColor, 'id'>) => {
    setPalette((prev) => [...prev, { ...color, id: crypto.randomUUID() }])
  }, [setPalette])

  const updateColor = useCallback((id: string, updates: Partial<Pick<PaletteColor, 'name' | 'value'>>) => {
    setPalette((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c))
  }, [setPalette])

  const removeColor = useCallback((id: string) => {
    setPalette((prev) => prev.filter((c) => c.id !== id || c.locked))
  }, [setPalette])

  const resetToDefaults = useCallback(() => {
    setPalette(DEFAULT_PALETTE)
  }, [setPalette])

  const getColorsContext = useCallback((): string => {
    if (palette.length === 0) return ''
    const list = palette.map((c) => `- ${c.name}: ${c.value}`).join('\n')
    return `Project color palette — use ONLY these colors for all styling (backgrounds, text, accents, borders). Do not introduce colors outside this palette unless strictly required for accessibility:\n${list}`
  }, [palette])

  return { palette, addColor, updateColor, removeColor, resetToDefaults, getColorsContext }
}
