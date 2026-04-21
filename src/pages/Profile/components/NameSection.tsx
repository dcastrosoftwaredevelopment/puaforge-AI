import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { TextInput } from 'flowbite-react';
import Button from '@/components/ui/Button';

interface Props {
  name: string
  setName: (v: string) => void
  nameError: string
  nameSaving: boolean
  nameSuccess: boolean
  handleSaveName: (e: React.FormEvent) => void
}

export default function NameSection({ name, setName, nameError, nameSaving, nameSuccess, handleSaveName }: Props) {
  const { t } = useTranslation();
  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-xl p-5 mb-6">
      <h2 className="text-sm font-medium text-text-primary mb-4">{t('profile.nameSection')}</h2>
      <form onSubmit={handleSaveName} className="flex flex-col gap-3">
        <div>
          <TextInput
            type="text"
            value={name}
            color={nameError ? 'failure' : 'gray'}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('profile.namePlaceholder')}
          />
          {nameError && <p className="text-xs text-red-400 mt-1">{nameError}</p>}
          {nameSuccess && <p className="text-xs text-vibe-blue mt-1">{t('profile.nameSuccess')}</p>}
        </div>
        <Button type="submit" variant="primary" size="md" isLoading={nameSaving} className="self-end gap-2">
          {nameSaving && <Loader2 size={13} className="animate-spin" />}
          {t('common.save')}
        </Button>
      </form>
    </div>
  );
}
