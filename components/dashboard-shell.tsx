'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GramRole, roleLabels } from '@/lib/grams-data';
import { currentRole } from '@/lib/auth';
import { languageOptions } from '@/lib/i18n/translations';
import { useSettings } from '@/lib/context/settings-context';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Bell, BookOpen, Building2, CalendarDays, ClipboardList, FileText, HeartPulse, LayoutDashboard, LogOut, Map, Menu, ShieldCheck, Stethoscope, Users, Wifi, X, User, ChevronDown, Pill } from 'lucide-react';
import { syncEngine } from '@/lib/offline/sync-engine';

type NavItem = {
  href: string;
  label: string;
  icon: any;
};

function getRoleNav(role: GramRole, t: (key: string, fallback?: string) => string): NavItem[] {
  switch (role) {
    case 'central':
      return [
        { href: 'dashboard', label: t('navCentralDashboard', 'Central Authority Dashboard'), icon: LayoutDashboard },
        { href: 'patients', label: t('navAllPatientData', 'All Patient Data'), icon: Users },
        { href: 'appointments', label: t('navAppointments', 'PHC Appointments'), icon: CalendarDays },
        { href: 'facilities', label: t('navFacilities', 'PHC Facilities'), icon: Building2 },
        { href: 'doctors', label: t('navDoctors', 'Doctors & Staff'), icon: Stethoscope },
        { href: 'workers', label: t('workers', 'PHC Workers'), icon: Users },
        { href: 'resources', label: t('navEquipmentDemands', 'Equipment & Resource Demands'), icon: ClipboardList },
        { href: 'feedback', label: t('navFeedbackSection', 'Feedback Section'), icon: FileText },
        { href: 'complaints', label: t('navComplaintBox', 'Complaint Box'), icon: Bell },
        { href: 'map', label: t('navAreaLocations', 'Area & PHC Locations'), icon: Map },
        { href: 'referrals', label: t('navReferrals', 'Referrals Monitoring'), icon: ClipboardList },
        { href: 'follow-ups', label: t('navFollowUpsTreatment', 'Follow-up Monitoring'), icon: CalendarDays },
        { href: 'outbreaks', label: t('navAreaOutbreaks', 'Outbreak Monitoring'), icon: HeartPulse }
      ];
    case 'head':
      return [
        { href: 'dashboard', label: t('navAreaDashboard', 'Area PHC Dashboard'), icon: LayoutDashboard },
        { href: 'patients', label: t('navAreaPatientsDoctors', 'Area Patients & Doctors'), icon: Users },
        { href: 'appointments', label: t('navAppointments', 'PHC Appointments'), icon: CalendarDays },
        { href: 'facilities', label: t('navFacilities', 'PHC Facilities'), icon: Building2 },
        { href: 'doctors', label: t('navDoctors', 'Doctors & Staff'), icon: Stethoscope },
        { href: 'workers', label: t('workers', 'PHC Workers'), icon: Users },
        { href: 'resources', label: t('navDemandResources', 'Demand Resources'), icon: ClipboardList },
        { href: 'outbreaks', label: t('navAreaOutbreaks', 'Area Outbreaks & Camps'), icon: HeartPulse },
        { href: 'referrals', label: t('navReferrals', 'PHC Referrals'), icon: ClipboardList },
        { href: 'follow-ups', label: t('navFollowUpsTreatment', 'Follow-up Status'), icon: CalendarDays }
      ];
    case 'worker':
      return [
        { href: 'dashboard', label: t('navPhcCareDashboard', 'PHC Care Dashboard'), icon: LayoutDashboard },
        { href: 'patients', label: t('navRegisterPatients', 'Register & Patients'), icon: Users },
        { href: 'appointments', label: t('navAppointments', 'PHC Appointments'), icon: CalendarDays },
        { href: 'facilities', label: t('navFacilities', 'PHC Facilities'), icon: Building2 },
        { href: 'assessment', label: t('navRiskScreening', 'Risk Screening'), icon: HeartPulse },
        { href: 'follow-ups', label: t('navFollowUpsTreatment', 'Follow-ups & Treatment'), icon: CalendarDays },
        { href: 'maternal-care', label: t('navMaternalChildCare', 'Maternal & Child Care'), icon: BookOpen },
        { href: 'referrals', label: t('navReferrals', 'Referrals'), icon: ClipboardList }
      ];
    case 'patient':
      return [
        { href: 'patient-dashboard', label: t('navMyHealthDashboard', 'My Health Dashboard'), icon: LayoutDashboard },
        { href: 'appointments', label: t('navAppointments', 'PHC Appointments'), icon: CalendarDays },
        { href: 'doctors', label: t('navDoctors', 'Nearby Doctors'), icon: Stethoscope },
        { href: 'facilities', label: t('navFacilities', 'PHC Facilities'), icon: Building2 },
        { href: 'map', label: t('navNearbyDoctors', 'Nearby Map Locations'), icon: Map },
        { href: 'health-education', label: t('navCartoonGuidance', 'Cartoon Guidance Videos'), icon: BookOpen },
        { href: 'referrals', label: t('navCareAppointments', 'Referrals & Care'), icon: ClipboardList },
        { href: 'complaints', label: t('navComplaintBox', 'Complaint Box'), icon: Bell },
        { href: 'feedback', label: t('navFeedbackSection', 'Feedback Section'), icon: FileText }
      ];
    default:
      return [
        { href: 'dashboard', label: t('navDashboard', 'Dashboard'), icon: LayoutDashboard },
        { href: 'patients', label: t('navPatients', 'Patients'), icon: Users },
        { href: 'appointments', label: t('navAppointments', 'Appointments'), icon: CalendarDays },
        { href: 'facilities', label: t('navFacilities', 'PHC Facilities'), icon: Building2 },
        { href: 'referrals', label: t('navReferrals', 'Referrals'), icon: ClipboardList },
        { href: 'health-education', label: t('navCartoonGuidance', 'Health Guidance'), icon: BookOpen }
      ];
  }
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useSettings();
  const { t } = useTranslation();
  const [role, setRole] = useState<GramRole>('central');
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    currentRole().then(found => {
      if (found) {
        setRole(found);
      } else {
        router.replace('/login');
      }
    });
    return syncEngine.subscribe((state, count) => { setOnline(state); setPending(count); });
  }, [router]);

  useEffect(() => {
    setOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [path]);

  useEffect(() => {
    function closeMenus(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    window.addEventListener('keydown', closeMenus);
    return () => window.removeEventListener('keydown', closeMenus);
  }, []);

  const nav = getRoleNav(role, t);

  async function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('override_role');
      localStorage.removeItem('gramcare_role');
      localStorage.removeItem('demo_role');
    }
    const { supabase } = await import('@/lib/supabase/client');
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const logoHref = role === 'patient' ? '/patient-dashboard' : '/dashboard';

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-900 md:flex">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 ${open ? 'flex' : 'hidden'} w-72 shrink-0 flex-col bg-slate-950 p-5 text-white md:sticky md:top-0 md:flex md:h-screen`}>
        <button type="button" aria-label="Close menu" className="absolute right-4 top-4 md:hidden" onClick={() => setOpen(false)}>
          <X className="h-6 w-6" />
        </button>
        <Link href={logoHref} className="flex items-center gap-3 text-xl font-black">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-2xl text-white">+</span>
          <span>Gram<span className="text-blue-400">Care</span></span>
        </Link>
        <p className="mt-2 text-xs font-semibold text-slate-400">{t('connectedHealthcareTag', 'Connected Healthcare for Rural Communities')}</p>
        
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs">
          <span className="flex items-center gap-2 font-bold text-blue-200">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            {roleLabels[role] || 'Authorised User'}
          </span>
          <span className="mt-1 block text-slate-400">{t('roleWorkspace', 'Role-aware limited workspace')}</span>
        </div>

        <nav className="mt-6 space-y-1.5 overflow-y-auto flex-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const isSelected = path === `/${href}` || (href === 'dashboard' && path === '/dashboard') || (href === 'patient-dashboard' && path === '/patient-dashboard');
            return (
              <Link 
                onClick={() => setOpen(false)} 
                key={href} 
                href={`/${href}`} 
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={logout} 
          className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('secureLogout', 'Secure logout')}</span>
        </button>
      </aside>

      {/* Backdrop for Mobile Navigation */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden" 
          onClick={() => setOpen(false)} 
        />
      )}

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-7">
          <button 
            type="button"
            aria-label="Open menu" 
            className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 md:hidden" 
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className={`hidden items-center gap-2 text-xs font-bold sm:flex ${online ? 'text-emerald-700' : 'text-amber-700'}`}>
            <Wifi className="h-4 w-4" />
            {online ? t('online', 'Online') : t('offline', 'Offline')}
            {pending ? ` · Pending sync: ${pending}` : ` · ${t('allSynced', 'All records synchronized')}`}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <label className="sr-only" htmlFor="language-select">Interface language</label>
            <select 
              id="language-select" 
              value={language} 
              onChange={event => setLanguage(event.target.value as typeof language)} 
              className="max-w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600"
            >
              {languageOptions.map(option => (
                <option value={option.code} key={option.code}>{option.label}</option>
              ))}
            </select>
            
            {/* Notification Bell Dropdown Button */}
            <div className="relative">
              <button 
                type="button"
                aria-label="Notifications" 
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                }} 
                className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  2
                </span>
              </button>

              {/* Notification Popover Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <h4 className="font-extrabold text-xs text-slate-900">Notifications & Alerts</h4>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700">2 New</span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 text-xs">
                      <div className="flex items-center gap-2 font-bold text-blue-900">
                        <Pill className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>Prescription Reminder</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600">Paracetamol 500mg due at 8:00 PM today.</p>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 text-xs">
                      <div className="flex items-center gap-2 font-bold text-emerald-900">
                        <CalendarDays className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Upcoming Appointment</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600">PHC OPD consultation scheduled tomorrow at 10:00 AM.</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <Link
                      href="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="block w-full text-center rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
                    >
                      View All Notifications & Reminders →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Account Menu"
              >
                <div className="grid h-6 w-6 place-items-center rounded-md bg-blue-600 text-white font-black text-[10px]">
                  {role ? role.slice(0, 2).toUpperCase() : 'US'}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {/* User Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="font-black text-xs text-slate-900 capitalize">{roleLabels[role] || 'Authorised User'}</p>
                    <p className="text-[10px] text-slate-500">GramCare Account Session</p>
                  </div>

                  <Link
                    href={role === 'patient' ? '/patient-dashboard' : '/dashboard'}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <LayoutDashboard className="h-4 w-4 text-blue-600" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/reports"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <span>Medical Reports Store</span>
                  </Link>

                  <Link
                    href="/notifications"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Bell className="h-4 w-4 text-amber-600" />
                    <span>Notifications & Reminders</span>
                  </Link>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('secureLogout', 'Secure logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-7 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
