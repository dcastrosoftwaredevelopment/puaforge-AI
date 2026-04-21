import { Plus, FolderOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'

interface EmptyStateProps {
  onCreate: () => void
}

export default function EmptyState({ onCreate }: EmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-forge-terracotta/10 border border-forge-terracotta/20 flex items-center justify-center mb-4">
        <FolderOpen size={28} className="text-forge-terracotta" />
      </div>
      <p className="text-text-secondary text-sm mb-4">{t('projects.emptyTitle')}</p>
      <Button variant="terracotta" size="md" onClick={onCreate} className="gap-2">
        <Plus size={16} />
        {t('projects.emptyCreate')}
      </Button>
    </div>
  )
}
