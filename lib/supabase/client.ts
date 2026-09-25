import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kcmnbpnyancukrfjlkka.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbW5icG55YW5jdWtyZmpsa2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjM4NjIsImV4cCI6MjEwNDQ5OTg2Mn0.9J5amMVl3GMtcrL4DLRDrx-zPBsXS8IZmh9UOQxyPYg';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

