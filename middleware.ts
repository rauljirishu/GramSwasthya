import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicPaths = new Set(['/', '/login', '/signup', '/verify-email']);

const dbToUiRole: Record<string, string> = {
  central_authority: 'central',
  central: 'central',
  admin: 'central',
  medical_officer: 'central',
  phc_head: 'head',
  head: 'head',
  phc_worker: 'worker',
  worker: 'worker',
  asha: 'worker',
  anm: 'worker',
  doctor: 'doctor',
  hospital: 'hospital',
  patient: 'patient'
};

const routeRoles: Record<string, string[]> = {
  '/dashboard': ['central', 'head', 'worker', 'doctor', 'hospital', 'patient'],
  '/patient-dashboard': ['patient'],
  '/patients': ['central', 'head', 'worker', 'doctor'],
  '/assessment': ['head', 'worker', 'doctor'],
  '/referrals': ['head', 'worker', 'doctor', 'hospital', 'patient'],
  '/follow-ups': ['head', 'worker', 'doctor', 'hospital', 'patient'],
  '/hospital': ['central', 'hospital'],
  '/maternal-care': ['head', 'worker', 'patient'],
  '/health-education': ['head', 'worker', 'doctor', 'hospital', 'patient'],
  '/map': ['central', 'head', 'worker', 'doctor', 'hospital', 'patient'],
  '/resources': ['central', 'head', 'worker'],
  '/health-camps': ['central', 'head', 'worker', 'patient'],
  '/outbreaks': ['central', 'head', 'worker'],
  '/workers': ['central', 'head'],
  '/reports': ['central', 'head']
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // Allow static assets, API routes, auth callbacks, and public pages
  const isPublic = publicPaths.has(path) || 
    path.startsWith('/auth/') || 
    path.startsWith('/api/') || 
    path.startsWith('/_next/') || 
    path.includes('.');

  if (isPublic) {
    return response;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kcmnbpnyancukrfjlkka.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbW5icG55YW5jdWtyZmpsa2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjM4NjIsImV4cCI6MjEwNDQ5OTg2Mn0.9J5amMVl3GMtcrL4DLRDrx-zPBsXS8IZmh9UOQxyPYg';

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll(items: { name: string; value: string; options: CookieOptions }[]) {
            items.forEach(x => request.cookies.set(x.name, x.value));
            response = NextResponse.next({ request });
            items.forEach(x => response.cookies.set(x.name, x.value, x.options));
          }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return response;
    }

    const overrideCookie = request.cookies.get('override_role')?.value || request.cookies.get('gramcare_role')?.value;
    let uiRole = 'central';
    if (overrideCookie) {
      uiRole = dbToUiRole[overrideCookie] || overrideCookie;
    } else {
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
      const rawRole = profile?.role || user.user_metadata?.requested_role || 'patient';
      uiRole = dbToUiRole[rawRole] || rawRole;
    }

    // Check route permissions
    const route = Object.keys(routeRoles).find(candidate => path === candidate || path.startsWith(`${candidate}/`));
    if (route && !routeRoles[route].includes(uiRole)) {
      const url = request.nextUrl.clone();
      url.pathname = uiRole === 'patient' ? '/patient-dashboard' : '/dashboard';
      return NextResponse.redirect(url);
    }
  } catch {
    return response;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
