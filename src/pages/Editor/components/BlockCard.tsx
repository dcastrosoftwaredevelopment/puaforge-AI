import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { type Block } from '@/utils/blockCatalog';
import BlockIcon from './BlockIcon';

interface BlockCardProps {
  block: Block;
  count: number;
  isSelected: boolean;
  onSelect: (block: Block) => void;
  onInsert: (block: Block) => void;
  onRemove: (block: Block) => void;
}

export default function BlockCard({ block, count, isSelected, onSelect, onInsert, onRemove }: BlockCardProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
    data: { block },
  });

  return (
    <div
      className={`group relative rounded-xl overflow-hidden border-2 transition ${
        isSelected ? 'border-forge-terracotta shadow-md' : 'border-transparent hover:border-border-default'
      }`}
    >
      {/* Main content — click selects the block */}
      <div
        onClick={() => onSelect(block)}
        onDoubleClick={() => onInsert(block)}
        className={`h-20 w-full ${block.previewBg} relative flex items-center justify-center cursor-pointer`}
      >
        {count > 0 && (
          <span className="absolute top-1.5 left-1.5 bg-forge-terracotta text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none select-none">
            ×{count}
          </span>
        )}
        <GripVertical
          size={11}
          className="absolute top-1.5 right-1.5 text-black/20 opacity-0 group-hover:opacity-100 transition pointer-events-none"
        />

        {/* Drag handle — dnd-kit listeners handle both pointer and touch */}
        <button
          ref={setNodeRef}
          type="button"
          {...listeners}
          {...attributes}
          className={`inline-flex items-center justify-center p-2 rounded-xl cursor-grab active:cursor-grabbing transition ${
            isDragging ? 'opacity-40 ring-2 ring-white/40' : ''
          }`}
        >
          <BlockIcon blockId={block.id} />
        </button>
      </div>

      {/* Footer */}
      <div className="bg-bg-elevated px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-text-secondary font-medium truncate">{t(block.labelKey)}</span>

        <div className="shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
          {count > 0 && (
            <span
              role="button"
              tabIndex={0}
              title={t('blocks.removeLast')}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(block);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onRemove(block);
                }
              }}
              className="flex items-center text-red-400 hover:text-red-300 transition"
            >
              <Trash2 size={11} />
            </span>
          )}
          <span
            role="button"
            tabIndex={0}
            title={t('blocks.insert')}
            onClick={(e) => {
              e.stopPropagation();
              onInsert(block);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onInsert(block);
              }
            }}
            className="flex items-center text-forge-terracotta hover:text-forge-terracotta/80 transition"
          >
            <Plus size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
