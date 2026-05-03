import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'flowbite-react';
import Button from '@/components/ui/Button';

interface AddMemberFormProps {
  teamId: string;
  isAdding: boolean;
  onAdd: (email: string) => Promise<void>;
}

export default function AddMemberForm({ isAdding, onAdd }: AddMemberFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await onAdd(email.trim());
    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-3 pt-3 border-t border-border-subtle">
      <TextInput
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('team.addMemberPlaceholder')}
        sizing="sm"
        disabled={isAdding}
        className="flex-1"
      />
      <Button variant="secondary" size="xs" type="submit" disabled={!email.trim() || isAdding}>
        {t('team.addMemberButton')}
      </Button>
    </form>
  );
}
