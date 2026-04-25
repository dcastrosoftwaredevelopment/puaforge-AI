import { useTranslation } from 'react-i18next';
import { ChevronDown, X, Search } from 'lucide-react';
import { useFontFamilyPicker } from '@/hooks/useFontFamilyPicker';

export default function FontFamilyPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (family: string) => void;
}) {
  const { t } = useTranslation();
  const { isOpen, open, close, select, search, setSearch, filtered, customFont, containerRef } = useFontFamilyPicker();

  const handleSelect = (family: string) => {
    onChange(select(family));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    close();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        onClick={isOpen ? close : open}
        className="w-full flex items-center justify-between gap-1 text-[11px] bg-bg-elevated border border-border-subtle rounded px-1.5 py-1 text-text-secondary hover:border-border-default transition cursor-pointer"
        style={value ? { fontFamily: `'${value}', sans-serif` } : undefined}
      >
        <span className="truncate">{value || t('inspect.fontDefault')}</span>
        <div className="flex items-center gap-0.5 shrink-0">
          {value && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:text-text-primary transition"
              title={t('inspect.clearFont')}
            >
              <X size={9} />
            </span>
          )}
          <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-bg-elevated border border-border-default rounded shadow-lg flex flex-col max-h-52 overflow-hidden">
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border-subtle shrink-0">
            <Search size={10} className="text-text-muted shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('inspect.searchFonts')}
              className="flex-1 bg-transparent text-[11px] text-text-primary placeholder-text-muted outline-none"
            />
          </div>

          <ul className="overflow-y-auto flex-1">
            {filtered.map((font) => (
              <li key={font.family}>
                <button
                  onClick={() => handleSelect(font.family)}
                  className={`w-full text-left px-2.5 py-1.5 text-[12px] transition cursor-pointer truncate hover:bg-bg-primary ${
                    value === font.family ? 'text-forge-terracotta bg-forge-terracotta/5' : 'text-text-secondary'
                  }`}
                  style={{ fontFamily: `'${font.family}', sans-serif` }}
                >
                  {font.family}
                </button>
              </li>
            ))}

            {customFont && (
              <li>
                <button
                  onClick={() => handleSelect(customFont)}
                  className="w-full text-left px-2.5 py-1.5 text-[11px] text-text-muted italic hover:bg-bg-primary hover:text-text-secondary transition cursor-pointer truncate"
                >
                  {t('inspect.useCustomFont', { font: customFont })}
                </button>
              </li>
            )}

            {filtered.length === 0 && !customFont && (
              <li className="px-2.5 py-2 text-[11px] text-text-muted">{t('inspect.noFontsFound')}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
