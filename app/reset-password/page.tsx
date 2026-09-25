'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError('This reset link is invalid or expired. Request a new one from the sign-in page.');
      return;
    }
    setSaved(true);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f8fc] p-4 dark:bg-slate-950">
      <section className="card w-full max-w-md space-y-5 p-6 shadow-xl sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white"><KeyRound className="h-5 w-5" /></div>
          <div><h1 className="text-xl font-black">Reset your password</h1><p className="text-xs text-slate-500">Choose a new password for your GramCare account.</p></div>
        </div>
        {saved ? (
          <div role="status" className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            <p>Your password has been updated.</p>
            <button type="button" onClick={() => router.replace('/login')} className="primary-btn">Return to sign in</button>
          </div>
        ) : (
          <form onSubmit={savePassword} className="space-y-4">
            <label className="block text-xs font-bold">
              New password
              <span className="relative mt-1.5 block">
                <input required minLength={8} autoComplete="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} className="input py-2.5 pr-11 text-xs" placeholder="At least 8 characters" />
                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-blue-700">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</p>}
            <button disabled={busy} className="primary-btn w-full justify-center"><Lock className="h-4 w-4" />{busy ? 'Saving…' : 'Save new password'}</button>
            <p className="text-center text-xs"><Link href="/login" className="font-bold text-blue-700 hover:underline">Back to sign in</Link></p>
          </form>
        )}
      </section>
    </main>
  );
}
