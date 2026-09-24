'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GramRole, roleLabels } from '@/lib/grams-data';
import { currentRole } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { syncEngine } from '@/lib/offline/sync-engine';
import { 
  Bell, 
  Calendar, 
  CalendarDays, 
  HeartPulse, 
  LayoutDashboard, 
  LogOut, 
  Map, 
  Menu, 
  ShieldCheck, 
  Users, 
  X, 
  BookOpen, 
  ClipboardList, 
  Wifi,
  Lock,
  UserCheck
} from 'lucide-react';

const allNav = [
  ['dashboard', 'Dashboard', LayoutDashboard, ['central', 'head', 'worker', 'doctor', 'hospital', 'patient']],
  ['appointments', 'Appointments', Calendar, ['central', 'head', 'worker', 'doctor', 'hospital', 'patient']],
  ['patients', 'Patients', Users, ['head', 'worker', 'doctor']],
  ['referrals', 'Referrals', ClipboardList, ['central', 'head', 'worker', 'doctor', 'hospital', 'patient']],
  ['follow-ups', 'Follow-ups', CalendarDays, ['head', 'worker', 'doctor', 'hospital', 'patient']],
  ['maternal-care', 'Maternal Care', HeartPulse, ['head', 'worker', 'patient']],
  ['health-education', 'Health Guidance', BookOpen, ['central', 'head', 'worker', 'doctor', 'hospital', 'patient']],
  ['map', 'Nearby Care', Map, ['central', 'head', 'worker', 'doctor', 'hospital', 'patient']],
  ['workers', 'Workers', Users, ['central', 'head']]
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();

  const [role, setRole] = useState<GramRole | null>(null);
  const [authenticating, setAuthenticating] = useState(true);
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    currentRole().then(found => {
      if (!mounted) return;
      if (found) {
        setRole(found);
        setAuthenticating(false);
      } else {
        // No authenticated session -> Redirect to login immediately
        router.replace('/login');
      }
    });

    const unsubscribe = syncEngine.subscribe((state, count) => {
      if (mounted) {
        setOnline(state);
        setPending(count);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  // 1. Show loading shield screen if authentication is verifying
  if (authenticating || !role) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 p-4 text-white">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-4 animate-bounce">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black">Verifying Authentication & Role</h2>
          <p className="mt-1 text-xs text-slate-400">GramCare Security Guard · Authenticating user session</p>
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Filter navigation items strictly allowed for this authenticated user's database role
  const nav = allNav.filter(x => (x[3] as readonly GramRole[]).includes(role));

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 md:flex transition-colors">
      {/* Sidebar Navigation */}
      <aside
        className={`${
          open ? 'fixed inset-y-0 left-0 z-50' : 'hidden'
        } w-72 shrink-0 bg-slate-950 p-5 text-white md:sticky md:top-0 md:flex md:h-screen md:flex-col border-r border-slate-900`}
      >
        <button className="absolute right-4 top-4 md:hidden" onClick={() => setOpen(false)}>
          <X className="h-6 w-6 text-slate-400" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-3 text-xl font-black">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-2xl text-white shadow-md shadow-blue-500/30">
            +
          </span>
          <span>
            Gram<span className="text-blue-400">Care</span>
          </span>
        </Link>
        <p className="mt-2 text-xs font-semibold text-slate-400">Connected Healthcare for Rural Communities</p>

        {/* Read-Only Authenticated Role Badge (No switching allowed without logging in!) */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 text-xs">
          <span className="flex items-center gap-2 font-black text-blue-300">
            <UserCheck className="h-4 w-4 text-blue-400" />
            {roleLabels[role]}
          </span>
          <span className="mt-1 block text-[11px] text-slate-400 font-medium">
            Authenticated Session
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 space-y-1 overflow-y-auto">
          {nav.map(([href, label, Icon]) => (
            <Link
              onClick={() => setOpen(false)}
              key={href}
              href={`/${href}`}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                path === `/${href}`
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Secure Logout Action */}
        <button
          onClick={logout}
          className="mt-auto flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-300 hover:bg-rose-500/20 hover:text-rose-200 transition"
        >
          <LogOut className="h-4 w-4 text-rose-400" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="min-w-0 flex-1">
        {/* Sticky Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-3 backdrop-blur sm:px-7 transition-colors">
          <button className="rounded-lg p-2 text-slate-700 dark:text-slate-200 md:hidden" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          {/* Sync & Connectivity Indicator */}
          <div
            className={`hidden items-center gap-2 text-xs font-bold sm:flex ${
              online ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            <Wifi className="h-4 w-4" />
            <span>{online ? 'Online' : 'Offline'}</span>
            <span>{pending ? ` · Pending sync: ${pending}` : ' · All records synchronized'}</span>
          </div>

          {/* Read-Only Authenticated User Badge & Notifications */}
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/notifications"
              className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>

            {/* READ-ONLY ROLE BADGE: No dropdown, no unauthenticated role switching */}
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 border border-blue-200 dark:border-blue-800">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-extrabold text-blue-900 dark:text-blue-200">
                {roleLabels[role]}
              </span>
            </div>

            <button
              onClick={logout}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-300 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
