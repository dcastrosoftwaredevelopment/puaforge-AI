import { useTranslation } from 'react-i18next';
import { Search, X, CornerDownRight } from 'lucide-react';
import { useBlockLibrary } from '@/hooks/useBlockLibrary';
import { type Block, type BlockCategory } from '@/utils/blockCatalog';
import BlockCard from './BlockCard';

const CATEGORIES: Array<{ key: BlockCategory; labelKey: string }> = [
  { key: 'layout', labelKey: 'blocks.categoryLayout' },
  { key: 'typography', labelKey: 'blocks.categoryTypography' },
  { key: 'form', labelKey: 'blocks.categoryForm' },
  { key: 'ui', labelKey: 'blocks.categoryUI' },
];

export default function BlockLibraryPanel() {
  const { t } = useTranslation();
  const {
    query,
    setQuery,
    filtered,
    selected,
    setSelected,
    instanceCounts,
    hasActiveParent,
    dropTargetLabel,
    clearInsertParent,
    insertBlock,
    removeBlock,
  } = useBlockLibrary();

  const selectedCount = selected ? (instanceCounts[selected.id] ?? 0) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Insert-target banner */}
      {hasActiveParent && dropTargetLabel && (
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-forge-terracotta/10 border-b border-forge-terracotta/20 text-forge-terracotta text-xs font-medium">
          <CornerDownRight size={11} className="shrink-0" />
          <span className="truncate flex-1">
            {t('blocks.targetBanner')} <span className="font-semibold">{dropTargetLabel}</span>
          </span>
          <button
            type="button"
            onClick={clearInsertParent}
            className="shrink-0 hover:text-forge-terracotta/70 transition cursor-pointer"
            title={t('blocks.clearTarget')}
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="shrink-0 px-3 py-2 border-b border-border-subtle">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('blocks.searchPlaceholder')}
            className="w-full bg-bg-elevated border border-border-default rounded-md pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-forge-terracotta"
          />
        </div>
      </div>

      {/* Block grid */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {CATEGORIES.map(({ key, labelKey }) => {
          const blocks = filtered.filter((b: Block) => b.category === key);
          if (blocks.length === 0) return null;
          return (
            <div key={key}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">{t(labelKey)}</p>
              <div className="grid grid-cols-2 gap-2">
                {blocks.map((block: Block) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    count={instanceCounts[block.id] ?? 0}
                    isSelected={selected?.id === block.id}
                    onSelect={setSelected}
                    onInsert={insertBlock}
                    onRemove={removeBlock}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-xs text-text-muted text-center py-10">{t('blocks.emptySearch')}</p>
        )}
      </div>

      {/* Action bar */}
      {selected && (
        <div className="shrink-0 border-t border-border-subtle px-3 py-2 flex items-center justify-between gap-3 bg-bg-elevated">
          <span className="text-xs text-text-secondary truncate">
            {t(selected.labelKey)}
            {selectedCount > 0 && <span className="ml-1.5 text-forge-terracotta font-semibold">×{selectedCount}</span>}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => removeBlock(selected)}
                className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-red-500/20 transition cursor-pointer"
              >
                {t('blocks.removeLast')}
              </button>
            )}
            <button
              type="button"
              onClick={() => insertBlock(selected)}
              className="bg-forge-terracotta text-white text-xs font-semibold px-4 py-1.5 rounded-md hover:bg-forge-terracotta/90 transition cursor-pointer"
            >
              {hasActiveParent ? t('blocks.insertInside') : t('blocks.insert')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
