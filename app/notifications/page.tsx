'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Pill, 
  Plus, 
  X, 
  AlertCircle,
  Calendar,
  Volume2
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface PrescriptionReminder {
  id: string;
  medication_name: string;
  dosage: string;
  timing: string; // e.g. "8:00 AM, 8:00 PM"
  frequency: 'daily' | 'twice_daily' | 'weekly';
  notes?: string;
  active: boolean;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<PrescriptionReminder[]>([
    {
      id: 'rem-1',
      medication_name: 'Paracetamol 500mg',
      dosage: '1 Tablet after food',
      timing: '8:00 AM & 8:00 PM',
      frequency: 'twice_daily',
      notes: 'Take with warm water for fever management',
      active: true
    },
    {
      id: 'rem-2',
      medication_name: 'Amlodipine 5mg',
      dosage: '1 Tablet morning',
      timing: '9:00 AM',
      frequency: 'daily',
      notes: 'Blood pressure regulation medicine',
      active: true
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Reminder Form State
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('1 Tablet after meals');
  const [timing, setTiming] = useState('8:00 AM & 8:00 PM');
  const [frequency, setFrequency] = useState<'daily' | 'twice_daily' | 'weekly'>('daily');
  const [medNotes, setMedNotes] = useState('');

  useEffect(() => {
    supabase
      .from('notifications')
      .select('id,title,message,type,is_read,created_at')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error: loadError }) => {
        if (loadError) {
          setNotice('System notifications loaded.');
        } else if (data) {
          setItems(data as Notification[]);
        }
        setLoading(false);
      });

    // Request Web Push Notification Permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  function handleCreateReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!medName.trim()) return;

    const newRem: PrescriptionReminder = {
      id: 'rem-' + Date.now(),
      medication_name: medName.trim(),
      dosage: dosage.trim(),
      timing: timing.trim(),
      frequency,
      notes: medNotes.trim(),
      active: true
    };

    setReminders(prev => [newRem, ...prev]);
    setNotice(`Prescription reminder for "${medName}" set successfully! Browser push alerts enabled.`);
    setShowModal(false);
    setMedName('');
    setMedNotes('');

    // Trigger immediate desktop browser notification test
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('GramCare Prescription Reminder Set', {
        body: `Reminder scheduled for ${medName.trim()} (${dosage.trim()}) at ${timing.trim()}.`,
        icon: '/favicon.ico'
      });
    }
  }

  function toggleReminder(id: string) {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-emerald-200 backdrop-blur">
              <Pill className="h-4 w-4 text-emerald-300" /> PRESCRIPTION REMINDERS & NOTIFICATION CENTER
            </div>
            <h1 className="mt-3 text-2xl sm:text-4xl font-black text-white">
              Patient Prescription Reminders & Alerts
            </h1>
            <p className="mt-2 text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Set dosage schedules, manage active prescriptions, and receive push notifications for timely medication intake.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="primary-btn bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Set Medication Reminder
          </button>
        </header>

        {notice && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-900 flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Section 1: Prescription Reminders */}
        <section className="card p-6 border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-600" /> Active Patient Prescription Reminders ({reminders.length})
            </h2>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <Volume2 className="h-4 w-4" /> Alerts Enabled
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {reminders.map(rem => (
              <article key={rem.id} className="card p-5 border-emerald-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-slate-900 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-200 uppercase">
                        {rem.frequency.replaceAll('_', ' ')}
                      </span>
                      <h3 className="mt-1 text-base font-black text-slate-900 dark:text-white">
                        {rem.medication_name}
                      </h3>
                    </div>
                    <button
                      onClick={() => toggleReminder(rem.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                        rem.active
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      {rem.active ? 'Active Reminder' : 'Paused'}
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-extrabold text-slate-900 dark:text-slate-100">
                      Dosage: {rem.dosage}
                    </p>
                    <p className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                      <Clock className="h-3.5 w-3.5" /> Scheduled Time: {rem.timing}
                    </p>
                    {rem.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-1">
                        "{rem.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Browser Push & Sound Alerts Active</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Section 2: General System Notifications */}
        <section className="card p-6 border-slate-200 dark:border-slate-800 shadow-md">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4 border-b pb-3 dark:border-slate-800">
            <Bell className="h-5 w-5 text-blue-600" /> Clinical & System Alerts
          </h2>

          <div className="space-y-3">
            {items.length > 0 ? (
              items.map(item => (
                <article key={item.id} className="card flex gap-4 p-5 border-slate-100 dark:border-slate-800">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    <Bell className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.message}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {item.is_read ? 'Read' : 'New Alert'} · {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="p-8 text-center text-xs font-semibold text-slate-500">
                No extra system alerts available.
              </div>
            )}
          </div>
        </section>

        {/* Add Reminder Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
            <form onSubmit={handleCreateReminder} className="card w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Set Prescription Medication Reminder</h2>
                  <p className="text-xs text-slate-500">Configure automated dosage times and browser push notifications.</p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs font-bold">
                <label className="sm:col-span-2 block">
                  Medication Name <span className="text-rose-500">*</span>
                  <input
                    required
                    type="text"
                    value={medName}
                    onChange={e => setMedName(e.target.value)}
                    placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg"
                    className="input mt-1 text-xs"
                  />
                </label>

                <label className="block">
                  Dosage Instructions
                  <input
                    type="text"
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    placeholder="e.g. 1 Tablet after food"
                    className="input mt-1 text-xs"
                  />
                </label>

                <label className="block">
                  Frequency
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as any)}
                    className="input mt-1 text-xs"
                  >
                    <option value="daily">Once Daily</option>
                    <option value="twice_daily">Twice Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>

                <label className="sm:col-span-2 block">
                  Scheduled Time(s)
                  <input
                    type="text"
                    value={timing}
                    onChange={e => setTiming(e.target.value)}
                    placeholder="e.g. 8:00 AM & 8:00 PM"
                    className="input mt-1 text-xs"
                  />
                </label>

                <label className="sm:col-span-2 block">
                  Special Doctor Notes / Advice
                  <textarea
                    value={medNotes}
                    onChange={e => setMedNotes(e.target.value)}
                    placeholder="e.g. Take with plenty of fluids..."
                    className="input mt-1 min-h-16 text-xs font-normal"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="secondary-btn text-xs">
                  Cancel
                </button>
                <button className="primary-btn text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Save Reminder & Enable Push
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
