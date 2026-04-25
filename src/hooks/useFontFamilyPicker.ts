import { useState, useEffect, useRef, useCallback } from 'react';
import { POPULAR_GOOGLE_FONTS, buildAllCuratedFontsUrl, type GoogleFont } from '@/utils/googleFonts';

const FONTS_LINK_ID = 'forge-google-fonts-picker';

function ensureFontsLoaded() {
  if (document.getElementById(FONTS_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = FONTS_LINK_ID;
  link.rel = 'stylesheet';
  link.href = buildAllCuratedFontsUrl();
  document.head.appendChild(link);
}

export function useFontFamilyPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) ensureFontsLoaded();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen]);

  const filtered: GoogleFont[] = search
    ? POPULAR_GOOGLE_FONTS.filter((f) => f.family.toLowerCase().includes(search.toLowerCase()))
    : POPULAR_GOOGLE_FONTS;

  const isCustom = search.trim().length > 0 && !POPULAR_GOOGLE_FONTS.some((f) => f.family.toLowerCase() === search.toLowerCase());
  const customFont = isCustom ? search.trim() : null;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => { setIsOpen(false); setSearch(''); }, []);
  const select = useCallback((family: string) => { setIsOpen(false); setSearch(''); return family; }, []);

  return { isOpen, open, close, select, search, setSearch, filtered, customFont, containerRef };
}
