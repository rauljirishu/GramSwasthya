import { useSettings } from '@/lib/context/settings-context';
import { translations } from './translations';
import { uiLabels, labels, dashboardTranslations } from './ui-labels';

export function useTranslation() {
  const { language } = useSettings();

  const t = (key: string, fallback?: string): string => {
    // 1. Direct translation entry
    const entry = translations[key];
    if (entry && entry[language]) {
      return entry[language]!;
    }
    // 2. Language-specific UI label (before merging default English)
    const langLabels = labels[language] as Record<string, string> | undefined;
    if (langLabels && langLabels[key]) {
      return langLabels[key];
    }
    const dashLabels = dashboardTranslations[language] as Record<string, string> | undefined;
    if (dashLabels && dashLabels[key]) {
      return dashLabels[key];
    }
    // 3. Fallback to English entry in translations
    if (entry && entry.en) {
      return entry.en;
    }
    // Components sometimes use a descriptive fallback while their translation
    // key differs from the canonical dictionary key. Resolve that English copy
    // back to its translated entry before leaving it untranslated.
    if (fallback) {
      const matchingEntry = Object.values(translations).find(candidate => candidate.en === fallback);
      if (matchingEntry?.[language]) return matchingEntry[language]!;
    }
    // 4. Default english uiLabels fallback
    const labelsObj = uiLabels('en') as Record<string, string>;
    if (labelsObj && labelsObj[key]) {
      return labelsObj[key];
    }
    return fallback || key;
  };

  return { t, language };
}
