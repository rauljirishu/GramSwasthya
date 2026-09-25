'use client';

import React from 'react';
import { useSettings } from '@/lib/context/settings-context';
import type { SupportedLanguage } from '@/lib/i18n/translations';
import { Globe } from 'lucide-react';

const languages: { code: SupportedLanguage; label: string; nativeName: string }[] = [
  { code: 'en', label: 'EN', nativeName: 'English' },
  { code: 'hi', label: 'HI', nativeName: 'हिन्दी (Hindi)' },
  { code: 'gu', label: 'GU', nativeName: 'ગુજરાતી (Gujarati)' },
  { code: 'mr', label: 'MR', nativeName: 'मराठी (Marathi)' }
];

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSelector({ compact = false, className = '' }: LanguageSelectorProps) {
  const { language, setLanguage } = useSettings();

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 transition cursor-pointer shadow-sm"
        title="Select Language / भाषा चुनें"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {compact ? lang.label : lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
