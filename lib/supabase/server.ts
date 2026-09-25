import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kcmnbpnyancukrfjlkka.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbW5icG55YW5jdWtyZmpsa2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjM4NjIsImV4cCI6MjEwNDQ5OTg2Mn0.9J5amMVl3GMtcrL4DLRDrx-zPBsXS8IZmh9UOQxyPYg';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component or Route Handler
            // where response headers may already be sent.
          }
        },
      },
    }
  );
}
