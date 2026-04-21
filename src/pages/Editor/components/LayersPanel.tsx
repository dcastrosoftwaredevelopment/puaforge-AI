import { RefreshCw, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLayersPanel } from '@/hooks/useLayersPanel';
import type { DOMNode } from '@/atoms';

function LayerNode({
  node,
  depth,
  selectedId,
  collapsed,
  toggleCollapse,
  onHover,
  onLeave,
  onSelect,
  onDoubleSelect,
  search,
}: {
  node: DOMNode;
  depth: number;
  selectedId: string | undefined;
  collapsed: Set<string>;
  toggleCollapse: (id: string) => void;
  onHover: (id: string) => void;
  onLeave: () => void;
  onSelect: (id: string) => void;
  onDoubleSelect: (id: string) => void;
  search: string;
}) {
  const label = `${node.tagName}${node.className ? '.' + node.className.split(' ').slice(0, 3).join('.') : ''}`;
  const isSelected = node.id === selectedId;
  const isCollapsed = collapsed.has(node.id);
  const hasChildren = node.children.length > 0;
  const matchesSearch = !search || label.toLowerCase().includes(search.toLowerCase());
  const childrenMatchSearch = !search || node.children.some((c) => matchesSearch || c.tagName.includes(search));

  if (search && !matchesSearch && !childrenMatchSearch) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-0.5 px-2 cursor-pointer rounded text-xs select-none group transition ${
          isSelected ?
            'bg-forge-terracotta/10 text-forge-terracotta'
          : 'text-text-muted hover:bg-bg-elevated hover:text-text-secondary'
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={onLeave}
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => onDoubleSelect(node.id)}
      >
        {hasChildren ?
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(node.id);
            }}
            className="shrink-0 text-text-muted/60 hover:text-text-muted cursor-pointer"
          >
            {isCollapsed ?
              <ChevronRight size={11} />
            : <ChevronDown size={11} />}
          </button>
        : <span className="shrink-0 w-[11px]" />}
        <span className="truncate text-[11px] font-mono">{label}</span>
      </div>
      {!isCollapsed && hasChildren && (
        <div>
          {node.children.map((child) => (
            <LayerNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              onHover={onHover}
              onLeave={onLeave}
              onSelect={onSelect}
              onDoubleSelect={onDoubleSelect}
              search={search}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LayersPanel() {
  const { t } = useTranslation();
  const {
    domTree,
    selectedElement,
    search,
    setSearch,
    collapsed,
    toggleCollapse,
    selectById,
    goToStyleById,
    hoverById,
    clearHover,
    refreshTree,
  } = useLayersPanel();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border-subtle shrink-0">
        <Search size={11} className="text-text-muted shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('inspect.layersSearch')}
          className="flex-1 text-[11px] bg-transparent text-text-secondary placeholder-text-muted/50 outline-none"
        />
        <button
          onClick={refreshTree}
          title={t('inspect.layersRefresh')}
          className="p-0.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-elevated transition cursor-pointer"
        >
          <RefreshCw size={11} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {domTree.length === 0 ?
          <p className="text-xs text-text-muted/50 text-center mt-6 px-4">{t('inspect.layersEmpty')}</p>
        : domTree.map((node) => (
            <LayerNode
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedElement?.id}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
              onHover={hoverById}
              onLeave={clearHover}
              onSelect={selectById}
              onDoubleSelect={goToStyleById}
              search={search}
            />
          ))
        }
      </div>
    </div>
  );
}
