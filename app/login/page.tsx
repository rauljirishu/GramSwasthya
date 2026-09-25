'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { uiRoleFor } from '@/lib/auth';
import { 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  KeyRound,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function sendPasswordReset() {
    if (!email.trim()) {
      setError('Enter your account email first, then select Forgot password.');
      return;
    }
    setResetBusy(true);
    setError('');
    setNotice('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (resetError) setError(resetError.message);
    else setNotice('If an account exists for that email, a password reset link has been sent.');
    setResetBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your account email and password.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      // Sign out any old session
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('override_role');
        localStorage.removeItem('gramcare_role');
        localStorage.removeItem('demo_role');
      }

      // 1. Authenticate with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError || !data?.user) {
        setError(authError?.message || 'Invalid email or password. Please try again.');
        setBusy(false);
        return;
      }

      // 2. Fetch User Profile & Role
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const userRole = profileError ? '' : profile?.role || '';

      if (!userRole) {
        setError('Your account does not have an assigned GramCare role. Please contact an administrator.');
        await supabase.auth.signOut();
        setBusy(false);
        return;
      }

      const targetUiRole = uiRoleFor(userRole);

      if (typeof window !== 'undefined') {
        localStorage.setItem('override_role', targetUiRole);
        localStorage.setItem('gramcare_role', userRole);
      }

      router.replace(targetUiRole === 'patient' ? '/patient-dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8fc] dark:bg-slate-950 p-4 lg:p-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-md space-y-6">
        
        {/* Top Branding & Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-3 text-3xl font-black text-slate-900 dark:text-white">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-2xl text-white shadow-lg">+</span>
            Gram<span className="text-blue-600">Care</span>
          </Link>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Connected Rural Healthcare Platform across India
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card p-6 sm:p-8 shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-md">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Sign In to GramCare</h1>
              <p className="text-xs text-slate-500">Enter your credentials to access your workspace</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Account Email <span className="text-rose-500">*</span>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input mt-1.5 py-2.5 text-xs font-semibold"
                placeholder="name@example.com"
              />
            </label>

            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Password <span className="text-rose-500">*</span>
              <span className="relative mt-1.5 block">
                <input required type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input py-2.5 pr-11 text-xs font-semibold" placeholder="Enter password" />
                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-500 hover:text-blue-700">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <div className="-mt-2 text-right">
              <button type="button" onClick={sendPasswordReset} disabled={resetBusy} className="text-xs font-bold text-blue-600 hover:underline disabled:opacity-50">
                {resetBusy ? 'Sending reset link…' : 'Forgot password?'}
              </button>
            </div>

            {error && (
              <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}
            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">{notice}</p>}

            <button
              disabled={busy}
              className="primary-btn w-full justify-center text-xs py-3 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg"
            >
              <Lock className="h-4 w-4" />
              {busy ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>Don't have an account?</span>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              <UserPlus className="h-3.5 w-3.5" /> Create new account
            </Link>
          </div>
        </div>

        {/* Security Note Footer */}
        <div className="text-center text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          End-to-End Row Level Security (RLS) Active
        </div>

      </div>
    </main>
  );
}
