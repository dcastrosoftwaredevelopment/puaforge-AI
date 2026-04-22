import { type ReactNode } from 'react';
import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCopyButton } from '@/hooks/useCopyButton';

export default function CopyButton({ text, title: titleProp, icon }: { text: string; title?: string; icon?: ReactNode }) {
  const { t } = useTranslation();
  const { copied, copy } = useCopyButton(text);

  return copied ?
      <span className="text-[10px] text-success">{t('common.copied')}</span>
    : <button
        onClick={copy}
        className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
        title={titleProp ?? t('images.copyToChat')}
      >
        {icon ?? <Copy size={12} />}
      </button>;
}
