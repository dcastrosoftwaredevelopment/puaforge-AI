import { useTranslation } from 'react-i18next';
import { useGlobalFont } from '@/hooks/useGlobalFont';
import StyleEditorSection from './StyleEditorSection';
import StyleEditorRow from './StyleEditorRow';
import FontFamilyPicker from './FontFamilyPicker';

export default function GlobalFontSection() {
  const { t } = useTranslation();
  const { globalFont, setGlobalFont } = useGlobalFont();

  return (
    <StyleEditorSection title={t('inspect.globalFont')}>
      <StyleEditorRow label={t('inspect.fontFamily')}>
        <FontFamilyPicker value={globalFont} onChange={setGlobalFont} />
      </StyleEditorRow>
    </StyleEditorSection>
  );
}
