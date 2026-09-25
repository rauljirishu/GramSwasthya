import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const invalidCredentials = () => NextResponse.json(
  { error: 'Patient ID or password is incorrect.' },
  { status: 401 }
);

export async function POST(request: Request) {
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Patient ID sign-in is not configured on this server.' }, { status: 503 });
  }

  let patientId = '';
  let password = '';
  try {
    const body = await request.json();
    patientId = String(body.patientId || '').trim().toUpperCase();
    password = String(body.password || '');
  } catch {
    return invalidCredentials();
  }
  if (!/^PID-[A-F0-9]{16}$/.test(patientId) || !password || password.length > 256) {
    return invalidCredentials();
  }

  const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: profile, error: lookupError } = await admin
    .from('users')
    .select('email, role')
    .eq('account_id', patientId)
    .maybeSingle();
  if (lookupError || !profile?.email || profile.role !== 'patient') return invalidCredentials();

  const cookieStore = await cookies();
  const sessionClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(items: { name: string; value: string; options: CookieOptions }[]) {
        items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      }
    }
  });
  const { error: signInError } = await sessionClient.auth.signInWithPassword({
    email: profile.email,
    password
  });
  if (signInError) return invalidCredentials();
  return NextResponse.json({ ok: true });
}
