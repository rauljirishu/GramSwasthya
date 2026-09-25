'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Lock, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { createAccountId, type RequestedAccountRole } from '@/lib/account-id';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requestedRole, setRequestedRole] = useState('patient');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<{ id: string; role: RequestedAccountRole } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    const targetEmail = email.trim();
    const roleToRequest = requestedRole as RequestedAccountRole;
    const accountId = createAccountId(roleToRequest);

    // 1. Sign up user in Supabase Auth
    const { data, error: signupError } = await supabase.auth.signUp({
      email: targetEmail,
      password,
      options: {
        data: {
          name: name.trim(),
          requested_role: roleToRequest,
          account_id: accountId,
        }
      }
    });

    if (signupError) {
      setError(signupError.message);
      setBusy(false);
      return;
    }

    // Role requests are recorded for Central Authority review. Self-signup
    // must never grant staff privileges; patient remains the safe initial role.
    if (data.user) {
      if (!data.session) {
        router.replace(`/verify-email?email=${encodeURIComponent(targetEmail)}&accountId=${encodeURIComponent(accountId)}&requestedRole=${encodeURIComponent(roleToRequest)}`);
        return;
      }
      if (roleToRequest !== 'patient') await supabase.auth.signOut();
      setCreatedAccount({ id: accountId, role: roleToRequest });
      setBusy(false);
      return;
    }

    router.replace(`/verify-email?email=${encodeURIComponent(targetEmail)}&accountId=${encodeURIComponent(accountId)}&requestedRole=${encodeURIComponent(roleToRequest)}`);
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
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">ACCOUNT ROLE REQUEST</span>
          <h1 className="mt-5 max-w-lg text-5xl font-black leading-tight">Create your GramCare account.</h1>
          <p className="mt-5 max-w-md leading-7 text-blue-100">Choose your role scope. Staff access is activated by Central Authority after your account is reviewed.</p>
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
              <p className="text-xs text-slate-500">Register and request your role scope</p>
            </div>
          </div>

          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p>}

          {createdAccount && <div role="status" className="mt-5 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-bold">Account created. Save your unique ID:</p>
            <p className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-center font-mono text-xl font-black tracking-wider">{createdAccount.id}</p>
            {createdAccount.role === 'patient' ? <p>Use this Patient ID when contacting your PHC. Your clinical PID is linked when your patient record is registered.</p> : <p>Your {createdAccount.role === 'central_authority' ? 'Central Authority' : createdAccount.role === 'phc_head' ? 'PHC Head' : 'PHC Worker'} access request is pending Central Authority approval. This ID does not activate staff permissions.</p>}
            <button type="button" onClick={() => router.replace(createdAccount.role === 'patient' ? '/patient-dashboard' : `/login?roleRequest=${encodeURIComponent(createdAccount.role)}`)} className="secondary-btn w-full justify-center">Continue to sign in</button>
          </div>}

          {!createdAccount && <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs font-bold text-slate-800">
              Full Name
              <input required value={name} onChange={event => setName(event.target.value)} className="input mt-1.5 py-2 text-xs font-semibold" placeholder="e.g. Dr. Sunita Rao" />
            </label>

            <label className="block text-xs font-bold text-slate-800">
              Email Address
              <input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="input mt-1.5 py-2 text-xs font-semibold" placeholder="e.g. sunita@gramcare.gov.in" />
            </label>

            <label className="block text-xs font-bold text-slate-800">
              Account Role Scope
              <select value={requestedRole} onChange={event => setRequestedRole(event.target.value)} className="input mt-1.5 py-2 text-xs font-semibold">
                <option value="central_authority">Central Authority (CID)</option>
                <option value="phc_head">PHC Head (PHH ID)</option>
                <option value="phc_worker">PHC Staff / Worker (PHW ID)</option>
                <option value="patient">Patient (PID)</option>
              </select>
              {requestedRole !== 'patient' && <span className="mt-1 block text-[11px] font-medium text-amber-700">Staff role requests need Central Authority approval before staff access is enabled.</span>}
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

            <label className="block text-xs font-bold text-slate-800">
              Confirm Password
              <input required type={showPassword ? 'text' : 'password'} minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="input mt-1.5 py-2 text-xs font-semibold" placeholder="Re-enter password" />
            </label>

            <button disabled={busy} className="primary-btn w-full justify-center py-2.5 bg-blue-600 hover:bg-blue-700 text-xs mt-2">
              <Lock className="h-4 w-4" />
              {busy ? 'Creating account...' : 'Create Account & Sign In'}
            </button>
          </form>}

          <p className="mt-5 text-center text-xs font-semibold text-slate-600">
            Already have an account? <Link href="/login" className="font-bold text-blue-700">Sign in here</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
