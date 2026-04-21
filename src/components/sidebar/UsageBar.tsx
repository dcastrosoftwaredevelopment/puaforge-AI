import { Progress } from 'flowbite-react';
import { formatBytes, formatLimit } from '@/hooks/useUsage';

export default function UsageBar({ used, limit, unit }: { used: number; limit: number; unit?: string }) {
  const isUnlimited = limit === Infinity || limit >= 1e9;
  const pct = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isWarning = pct >= 80;
  const usedLabel = unit === 'bytes' ? formatBytes(used) : String(used);
  const limitLabel = formatLimit(limit, unit);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className={isWarning ? 'text-yellow-400' : 'text-text-muted'}>{usedLabel}</span>
        <span className="text-text-muted">{limitLabel}</span>
      </div>
      {!isUnlimited && (
        <Progress progress={pct} size="xs" color={isWarning ? 'yellow' : 'primary'} />
      )}
    </div>
  );
}
