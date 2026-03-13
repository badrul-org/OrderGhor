import { bn, type Translations } from './bn';
import { en } from './en';
import { useSettingsStore } from '../store/useSettingsStore';

const translations: Record<string, Translations> = { bn, en };

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);
  const t = translations[language] || bn;
  return { t, language };
}
