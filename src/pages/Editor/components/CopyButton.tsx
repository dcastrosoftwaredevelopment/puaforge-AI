import { useState } from 'react';
import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return copied ?
      <span className="text-[10px] text-success">{t('common.copied')}</span>
    : <button
        onClick={handleCopy}
        className="p-1 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
        title={t('images.copyToChat')}
      >
        <Copy size={12} />
      </button>;
}
