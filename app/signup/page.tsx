'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Lock, ShieldCheck, UserPlus, Crown, Building2, HeartPulse, UserCheck, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setBusy(true);
    const targetEmail = email.trim();

    // 1. Sign up user in Supabase Auth
    const { data, error: signupError } = await supabase.auth.signUp({
      email: targetEmail,
      password,
      options: {
        data: {
          name: name.trim(),
          requested_role: 'patient'
        }
      }
    });

    if (signupError) {
      setError(signupError.message);
      setBusy(false);
      return;
    }

    // Staff roles are assigned by Central Authority after account creation.
    if (data.user) {
      const { data: profile } = await supabase.from('users').select('id,role').eq('id', data.user.id).single();
      if (!profile) {
        await supabase.from('users').upsert({
          id: data.user.id,
          name: name.trim(),
          email: targetEmail,
          role: 'patient'
        });
      }

      router.replace('/patient-dashboard');
      return;
    }

    router.replace(`/verify-email?email=${encodeURIComponent(targetEmail)}`);
  }

  return (
    <main className="grid min-h-screen bg-slate-50 p-4 lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-gradient-to-br from-blue-800 to-slate-950 p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3 text-2xl font-black">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-2xl text-blue-700">+</span>
            GramCare
          </div>
          <p className="mt-2 text-sm font-semibold text-blue-200">Connected Healthcare for Rural Communities</p>
        </div>
        <div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">PATIENT ACCOUNT CREATION</span>
          <h1 className="mt-5 max-w-lg text-5xl font-black leading-tight">Create your GramCare account.</h1>
          <p className="mt-5 max-w-md leading-7 text-blue-100">Create a patient account to view your own linked health information. Staff accounts are assigned by Central Authority.</p>
        </div>
        <p className="text-sm text-blue-200">Data privacy and access are protected by role-based database policies.</p>
      </section>

      <section className="mx-auto flex w-full max-w-lg flex-col justify-center py-8">
        <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <div className="card border-slate-200 p-6 shadow-xl sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Create new account</h1>
              <p className="text-xs text-slate-500">Create your personal patient account</p>
            </div>
          </div>

          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p>}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-bold text-slate-800">
              Full Name
              <input required value={name} onChange={event => setName(event.target.value)} className="input mt-1.5 py-2 text-xs font-semibold" placeholder="e.g. Dr. Sunita Rao" />
            </label>

            <label className="block text-xs font-bold text-slate-800">
              Email Address
              <input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="input mt-1.5 py-2 text-xs font-semibold" placeholder="e.g. sunita@gramcare.gov.in" />
            </label>

            <label className="block text-xs font-bold text-slate-800">
              Password
              <span className="relative mt-1.5 block">
                <input required type={showPassword ? 'text' : 'password'} minLength={8} value={password} onChange={event => setPassword(event.target.value)} className="input py-2 pr-11 text-xs font-semibold" placeholder="At least 8 characters" />
                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-blue-700">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <button disabled={busy} className="primary-btn w-full justify-center py-2.5 bg-blue-600 hover:bg-blue-700 text-xs mt-2">
              <Lock className="h-4 w-4" />
              {busy ? 'Creating account...' : 'Create Account & Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs font-semibold text-slate-600">
            Already have an account? <Link href="/login" className="font-bold text-blue-700">Sign in here</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
