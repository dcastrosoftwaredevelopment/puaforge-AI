import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalBody } from 'flowbite-react';
import Button from '@/components/ui/Button';

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const resolvedConfirm = confirmLabel ?? t('common.confirm');
  const resolvedCancel = cancelLabel ?? t('common.cancel');

  return (
    <Modal show={open} onClose={onCancel} size="sm" dismissible>
      <ModalBody>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-forge-terracotta/10 flex items-center justify-center">
            <AlertTriangle size={16} className="text-forge-terracotta" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">{title}</h3>
            <p className="text-xs text-text-secondary mt-1">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="secondary" size="xs" onClick={onCancel} className="text-xs">
            {resolvedCancel}
          </Button>
          <Button variant="terracotta" size="xs" onClick={onConfirm} className="text-xs">
            {resolvedConfirm}
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
