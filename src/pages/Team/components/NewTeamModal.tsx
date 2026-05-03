import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalBody } from 'flowbite-react';
import { TextInput } from 'flowbite-react';
import Button from '@/components/ui/Button';

interface NewTeamModalProps {
  isCreating: boolean;
  onCreate: (name: string) => Promise<void>;
  onClose: () => void;
}

export default function NewTeamModal({ isCreating, onCreate, onClose }: NewTeamModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate(name.trim());
  };

  return (
    <Modal show dismissible onClose={onClose} size="sm">
      <ModalBody>
        <h2 className="text-base font-semibold text-text-primary mb-4">{t('team.createTeam')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('team.teamNamePlaceholder')}
            autoFocus
            disabled={isCreating}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isCreating}>
              {t('common.cancel')}
            </Button>
            <Button variant="terracotta" size="sm" type="submit" disabled={!name.trim() || isCreating}>
              {t('team.createTeam')}
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}
