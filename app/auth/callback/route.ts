import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // The database auth trigger creates a patient profile. Signup metadata is
      // never trusted to assign privileged staff roles.
      const meta = data.user.user_metadata || {};
      await supabase.from('users').update({
        name: meta.name || 'New patient',
        email: data.user.email
      }).eq('id', data.user.id);

      // Preferred UX: Redirect to login with verified notice
      return NextResponse.redirect(`${origin}/login?verified=true`);
    }
  }

  // Return to login with error state if verification exchange failed
  return NextResponse.redirect(`${origin}/login?error=verification_failed`);
}
