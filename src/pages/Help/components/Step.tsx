import { ExternalLink } from 'lucide-react';

export default function Step({ number, title, desc, link, linkLabel }: {
  number: number
  title: string
  desc: string
  link?: string
  linkLabel?: string
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-forge-terracotta/15 text-forge-terracotta text-xs font-bold flex items-center justify-center">
        {number}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary">{desc}</p>
        {link && linkLabel && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-forge-terracotta hover:underline mt-0.5"
          >
            {linkLabel}
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}
