'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Pill, 
  ShieldCheck, 
  Siren, 
  ArrowRight,
  Filter,
  Check,
  Plus,
  Building2,
  Volume2
} from 'lucide-react';

interface ReminderItem {
  id: string;
  category: 'appointment' | 'emergency' | 'prescription';
  title: string;
  subtitle: string;
  timeStr: string;
  priority: 'urgent' | 'high' | 'normal';
  pid?: string;
  facility?: string;
  taken?: boolean;
  reminded?: boolean;
}

const initialReminders: ReminderItem[] = [
  // PHC Emergency Alerts
  {
    id: 'emg-1',
    category: 'emergency',
    title: 'CRITICAL TRIAGE ALERT: Severe Hypertension (165/105 mmHg)',
    subtitle: 'High risk vitals detected for Patient PID: GC-2026-1002. Requires immediate PHC Doctor review.',
    timeStr: '10 mins ago',
    priority: 'urgent',
    pid: 'GC-2026-1002',
    facility: 'Rampur Primary Health Centre'
  },
  {
    id: 'emg-2',
    category: 'emergency',
    title: 'ANC Maternal High-Risk Alert: Hb < 8.5 g/dL',
    subtitle: 'Pooja Rathod (24 weeks pregnant) requires iron sucrose referral to CHC Hospital.',
    timeStr: '45 mins ago',
    priority: 'high',
    pid: 'GC-2026-1008',
    facility: 'Bhadarva PHC'
  },

  // Appointment Reminders
  {
    id: 'apt-1',
    category: 'appointment',
    title: 'Upcoming Clinical Consultation with Dr. Nikhil Shah',
    subtitle: 'Scheduled checkup & glycemic review at Rampur PHC Sector 2.',
    timeStr: 'Tomorrow at 09:30 AM',
    priority: 'high',
    pid: 'GC-2026-1001',
    facility: 'Rampur PHC'
  },
  {
    id: 'apt-2',
    category: 'appointment',
    title: 'Maternal Care & ANC Monthly Screening',
    subtitle: 'Ultrasonography & lab vitals checkup at CHC District Hospital.',
    timeStr: '28 Sep 2026 at 10:30 AM',
    priority: 'normal',
    pid: 'GC-2026-1004',
    facility: 'District Hospital'
  },

  // Prescription Timing Reminders (Patient Medication Schedule)
  {
    id: 'rx-1',
    category: 'prescription',
    title: 'Morning Dose: Metformin 1000mg & Folic Acid',
    subtitle: 'Take 1 tablet after breakfast (08:00 AM) with water.',
    timeStr: '08:00 AM (Morning)',
    priority: 'normal',
    pid: 'GC-2026-1001',
    taken: false
  },
  {
    id: 'rx-2',
    category: 'prescription',
    title: 'Afternoon Dose: Calcium & Vitamin D3 Supplement',
    subtitle: 'Take 1 tablet after lunch (01:30 PM).',
    timeStr: '01:30 PM (Afternoon)',
    priority: 'normal',
    pid: 'GC-2026-1001',
    taken: false
  },
  {
    id: 'rx-3',
    category: 'prescription',
    title: 'Evening Dose: Amlodipine 5mg (Blood Pressure Control)',
    subtitle: 'Take 1 tablet after dinner before sleep (08:30 PM).',
    timeStr: '08:30 PM (Evening)',
    priority: 'high',
    pid: 'GC-2026-1001',
    taken: false
  }
];

export default function NotificationsPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>(initialReminders);
  const [filter, setFilter] = useState<'all' | 'emergency' | 'appointment' | 'prescription'>('all');
  const [userRole, setUserRole] = useState<string>('patient');
  const [notice, setNotice] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (profile?.role) setUserRole(profile.role);
      }
    })();
  }, []);

  const filteredReminders = reminders.filter(item => filter === 'all' || item.category === filter);

  const toggleMedication = (id: string) => {
    setReminders(prev => prev.map(item => {
      if (item.id === id) {
        const nextTaken = !item.taken;
        setNotice(nextTaken ? `Medication "${item.title}" marked as TAKEN!` : `Medication "${item.title}" marked pending.`);
        setTimeout(() => setNotice(''), 3000);
        return { ...item, taken: nextTaken };
      }
      return item;
    }));
  };

  const setAlarmReminder = (title: string) => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('GramCare Reminder Set', {
            body: `Reminder enabled for: ${title}`,
            icon: '/favicon.ico'
          });
        }
      });
    }
    setNotice(`Reminder alarm set for "${title}"! You will be notified on schedule.`);
    setTimeout(() => setNotice(''), 4000);
  };

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <span className="eyebrow flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-blue-600" /> GramCare Communication Center
          </span>
          <h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">Reminders & Notifications</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Real-time PHC emergency triage alerts, appointment reminders, and prescription dosage schedules.
          </p>
        </div>
      </div>

      {notice && (
        <div role="status" className="mb-6 rounded-2xl bg-blue-50 dark:bg-blue-950/60 p-4 text-sm font-bold text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-blue-600 inline mr-2" />
          <span>{notice}</span>
        </div>
      )}

      {/* Security Info Banner */}
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3.5 text-xs font-semibold text-blue-900">
        <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
        <span>All reminders link to unique Patient IDs (PID) for complete healthcare continuity.</span>
      </div>

      {/* FILTER TABS */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1.5 text-xs font-extrabold">
        {[
          ['all', 'All Notifications', Bell],
          ['emergency', 'PHC Emergency Alerts', Siren],
          ['appointment', 'Appointment Reminders', Calendar],
          ['prescription', 'Prescription Dosage Timings', Pill]
        ].map(([key, label, Icon]) => {
          const I = Icon as typeof Bell;
          const isSelected = filter === key;
          return (
            <button
              key={key as string}
              onClick={() => setFilter(key as any)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 transition ${
                isSelected 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <I className="h-4 w-4" />
              <span>{label as string}</span>
            </button>
          );
        })}
      </div>

      {/* NOTIFICATIONS & REMINDERS LIST */}
      <div className="space-y-4">
        {filteredReminders.map((item) => {
          const isEmergency = item.category === 'emergency';
          const isAppointment = item.category === 'appointment';
          const isPrescription = item.category === 'prescription';

          return (
            <div 
              key={item.id}
              className={`card p-5 transition-all border ${
                isEmergency 
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60' 
                  : isPrescription && item.taken
                  ? 'bg-slate-50 dark:bg-slate-900/40 opacity-70 border-slate-200'
                  : 'hover:border-blue-300'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white font-black shadow-md ${
                    isEmergency 
                      ? 'bg-rose-600 shadow-rose-500/20' 
                      : isAppointment 
                      ? 'bg-blue-600 shadow-blue-500/20' 
                      : 'bg-indigo-600 shadow-indigo-500/20'
                  }`}>
                    {isEmergency && <Siren className="h-6 w-6 animate-pulse" />}
                    {isAppointment && <Calendar className="h-6 w-6" />}
                    {isPrescription && <Pill className="h-6 w-6" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        isEmergency 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-200' 
                          : isAppointment
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200'
                      }`}>
                        {item.category === 'emergency' ? 'PHC Emergency' : item.category}
                      </span>

                      {item.pid && (
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-extrabold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          PID: {item.pid}
                        </span>
                      )}

                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {item.timeStr}
                      </span>
                    </div>

                    <h2 className="text-base font-black text-slate-900 dark:text-white">{item.title}</h2>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">{item.subtitle}</p>

                    {item.facility && (
                      <p className="mt-2 text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-blue-600" /> Facility: {item.facility}
                      </p>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS BASED ON CATEGORY */}
                <div className="flex items-center gap-2">
                  {isPrescription && (
                    <button
                      onClick={() => toggleMedication(item.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                        item.taken 
                          ? 'bg-blue-700 text-white hover:bg-blue-800' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {item.taken ? <Check className="h-4 w-4" /> : <Pill className="h-4 w-4" />}
                      <span>{item.taken ? 'Taken' : 'Mark as Taken'}</span>
                    </button>
                  )}

                  {isEmergency && (
                    <Link
                      href={item.pid ? `/patients/${item.pid}` : '/referrals'}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-xs font-black shadow-md transition"
                    >
                      <Siren className="h-4 w-4" /> View Patient & Triage <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  {isAppointment && (
                    <Link
                      href="/appointments"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition"
                    >
                      <span>View Appointment</span> <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}

                  <button
                    onClick={() => setAlarmReminder(item.title)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
                    title="Set Alarm Reminder"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-blue-600" />
                    <span className="hidden sm:inline">Set Reminder</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
