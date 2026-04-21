import { formatBytes, formatLimit } from '@/hooks/useUsage';

export default function UsageRow({ label, used, limit, unit }: { label: string; used: number; limit: number; unit?: string }) {
  const isUnlimited = limit === Infinity || limit >= 1e9;
  const pct = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isWarning = pct >= 80;
  const usedLabel = unit === 'bytes' ? formatBytes(used) : String(used);
  const limitLabel = formatLimit(limit, unit);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className={`font-mono ${isWarning ? 'text-yellow-400' : 'text-text-muted'}`}>
          {usedLabel}{!isUnlimited && ` / ${limitLabel}`}{isUnlimited && ` / ${limitLabel}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1 bg-bg-primary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isWarning ? 'bg-yellow-400' : 'bg-forge-terracotta/60'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
