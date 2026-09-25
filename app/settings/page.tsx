'use client';

import { DashboardShell } from '@/components/dashboard-shell';
import { useSettings } from '@/lib/context/settings-context';
import { languageOptions } from '@/lib/i18n/translations';
import { Settings } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';

export default function SettingsPage() {
  const { language, setLanguage, theme, setTheme } = useSettings();
  const { t } = useTranslation();

  return (
    <DashboardShell>
      <section className="card max-w-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow">{t('preferences', 'Preferences')}</p>
            <h1 className="text-2xl font-black text-slate-900">{t('navSettings', 'Settings')}</h1>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">
            {t('interfaceLanguage', 'Interface language')}
            <select value={language} onChange={event => setLanguage(event.target.value as typeof language)} className="input mt-1">
              {languageOptions.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">
            {t('theme', 'Theme')}
            <select value={theme} onChange={event => setTheme(event.target.value as typeof theme)} className="input mt-1">
              <option value="light">{t('light', 'Light')}</option>
              <option value="dark">{t('dark', 'Dark')}</option>
            </select>
          </label>
        </div>
      </section>
    </DashboardShell>
  );
}
