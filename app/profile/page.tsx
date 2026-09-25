'use client';

import { DashboardShell } from '@/components/dashboard-shell';
import { User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <DashboardShell>
      <section className="card max-w-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow">Account</p>
            <h1 className="text-2xl font-black text-slate-900">Profile</h1>
          </div>
        </div>
        <p className="mt-5 text-sm text-slate-600">Your account details are managed through your authorised GramCare session.</p>
      </section>
    </DashboardShell>
  );
}