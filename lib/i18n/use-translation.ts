'use client';

import { useSettings } from '@/lib/context/settings-context';
import { getTranslation, SupportedLanguage } from './translations';

export function useTranslation() {
  const { language, setLanguage } = useSettings();

  const t = (key: string, fallback?: string): string => {
    return getTranslation(key, language as SupportedLanguage, fallback);
  };

  return { language, setLanguage, t };
}
