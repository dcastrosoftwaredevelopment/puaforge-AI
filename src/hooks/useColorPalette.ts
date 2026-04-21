import { useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { colorPaletteAtom, DEFAULT_PALETTE, activeProjectIdAtom, type PaletteColor } from '@/atoms';
import { authTokenAtom } from '@/atoms/authAtoms';
import { api } from '@/services/api';

export function useColorPalette() {
  const [palette, setPalette] = useAtom(colorPaletteAtom);
  const activeProjectId = useAtomValue(activeProjectIdAtom);
  const token = useAtomValue(authTokenAtom);

  const save = useCallback(async (updated: PaletteColor[]) => {
    if (!activeProjectId || !token) return;
    setPalette(updated);
    await api.put(`/api/projects/${activeProjectId}/palette`, { palette: updated }, { Authorization: `Bearer ${token}` });
  }, [activeProjectId, token, setPalette]);

  const addColor = useCallback((color: Omit<PaletteColor, 'id'>) => {
    const next = [...palette, { ...color, id: crypto.randomUUID() }];
    save(next);
  }, [palette, save]);

  const updateColor = useCallback((id: string, updates: Partial<Pick<PaletteColor, 'name' | 'value'>>) => {
    const next = palette.map((c) => c.id === id ? { ...c, ...updates } : c);
    save(next);
  }, [palette, save]);

  const removeColor = useCallback((id: string) => {
    const next = palette.filter((c) => c.id !== id || c.locked);
    save(next);
  }, [palette, save]);

  const resetToDefaults = useCallback(() => {
    save(DEFAULT_PALETTE);
  }, [save]);

  const getColorsContext = useCallback((): string => {
    if (palette.length === 0) return '';
    const list = palette.map((c) => `- ${c.name}: ${c.value}`).join('\n');
    return `Project color palette — use ONLY these colors for all styling (backgrounds, text, accents, borders). Do not introduce colors outside this palette unless strictly required for accessibility:\n${list}`;
  }, [palette]);

  return { palette, setPalette, addColor, updateColor, removeColor, resetToDefaults, getColorsContext };
}
