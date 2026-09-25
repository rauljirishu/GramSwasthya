'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { BadgeCheck, User } from 'lucide-react';

type Profile = { name: string; email: string | null; role: string; requested_role: string; account_id: string };
const accountType: Record<string, string> = {
  central_authority: 'Central Authority',
  phc_head: 'PHC Head',
  phc_worker: 'PHC Staff / Worker',
  patient: 'Patient',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notice, setNotice] = useState('Loading account…');

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setNotice('Sign in to view your account ID.'); return; }
      const { data, error } = await supabase.from('users')
        .select('name,email,role,requested_role,account_id').eq('id', user.id).single();
      if (!active) return;
      if (error) setNotice(`Account ID unavailable: ${error.message}. Apply the account-ID Supabase migration.`);
      else { setProfile(data as Profile); setNotice(''); }
    }
    void loadProfile();
    return () => { active = false; };
  }, []);

  return <DashboardShell>
    <section className="card max-w-2xl space-y-5 p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><User className="h-5 w-5" /></div>
        <div><p className="eyebrow">Account</p><h1 className="text-2xl font-black text-slate-900">Profile</h1></div>
      </div>
      {notice && <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{notice}</p>}
      {profile && <>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-800"><BadgeCheck className="h-4 w-4" /> Your unique GramCare ID</div>
          <p className="mt-2 font-mono text-2xl font-black tracking-wider text-slate-950">{profile.account_id}</p>
          {profile.requested_role !== 'patient' && profile.role === 'patient' && <p className="mt-2 text-xs font-semibold text-amber-800">{accountType[profile.requested_role] || 'Staff'} access is pending Central Authority approval.</p>}
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs font-bold uppercase text-slate-500">Name</dt><dd className="mt-1 font-semibold">{profile.name}</dd></div>
          <div><dt className="text-xs font-bold uppercase text-slate-500">Email</dt><dd className="mt-1 font-semibold">{profile.email || 'Not provided'}</dd></div>
          <div><dt className="text-xs font-bold uppercase text-slate-500">Active access</dt><dd className="mt-1 font-semibold">{accountType[profile.role] || profile.role}</dd></div>
          <div><dt className="text-xs font-bold uppercase text-slate-500">Requested account type</dt><dd className="mt-1 font-semibold">{accountType[profile.requested_role] || profile.requested_role}</dd></div>
        </dl>
      </>}
    </section>
  </DashboardShell>;
}
