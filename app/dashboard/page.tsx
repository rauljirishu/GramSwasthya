'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { GramRole, roleLabels } from '@/lib/grams-data';
import { currentRole } from '@/lib/auth';
import { BookAppointmentModal } from '@/components/book-appointment-modal';
import { Activity, ArrowRight, Calendar, CalendarDays, Plus, ShieldCheck, Users, WifiOff } from 'lucide-react';

const stats: Record<GramRole, [string, string][]> = {
  central: [['Total PHCs', '—'], ['Healthcare workers', '—'], ['Hospitals', '—'], ['Registered patients', '—'], ['Active referrals', '—'], ['Follow-ups due', '—']],
  head: [['PHC patients', '—'], ['Health workers', '—'], ['Doctors', '—'], ['High-risk cases', '—'], ['Pending referrals', '—'], ['Follow-ups due', '—']],
  worker: [['Assigned patients', '—'], ['Records pending sync', '0'], ['Follow-ups due', '—'], ['Referral updates', '—']],
  doctor: [['Assigned patients', '—'], ['Reviews required', '—'], ['Risk indicators', '—'], ['Pending referrals', '—']],
  hospital: [['Incoming referrals', '—'], ['Accepted referrals', '—'], ['Active cases', '—'], ['Follow-ups', '—']],
  patient: [['My health record', ''], ['Recent visits', ''], ['Referrals', ''], ['Follow-up date', '']]
};

export default function Dashboard() {
  const [role, setRole] = useState<GramRole>('central');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    currentRole().then(value => {
      if (value) setRole(value);
    });
  }, []);

  const actions = role === 'worker'
    ? [['Register patient', '/patients'], ['Book appointment', '/appointments'], ['Referrals', '/referrals'], ['Follow-ups', '/follow-ups']]
    : role === 'patient'
    ? [['Book appointment', '/appointments'], ['My health', '/patient-dashboard'], ['My referrals', '/referrals'], ['Health guidance', '/health-education']]
    : [['Book appointment', '/appointments'], ['Patients', '/patients'], ['Referrals', '/referrals'], ['Follow-ups', '/follow-ups']];

  return (
    <DashboardShell>
      {/* Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 p-6 text-white sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
              <ShieldCheck className="h-4 w-4" />{roleLabels[role]} dashboard
            </div>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Connected care for every village.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              GramCare supports secure healthcare continuity from field registration through clinical review, appointment booking, referral, treatment and follow-up.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] px-5 py-3 text-sm font-extrabold text-white shadow-lg transition"
          >
            <Plus className="h-4 w-4" /> Book Appointment
          </button>
        </div>
      </section>

      {notice && (
        <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800">
          {notice}
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold text-blue-900">
        <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
        Patient information is accessible only to authorised users with unique PID tracking.
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats[role].map(([name, value], i) => (
          <div className="card p-4" key={name}>
            <div className="flex justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">{name}</span>
              {i % 2 ? <Activity className="h-4 w-4 text-emerald-600" /> : <Users className="h-4 w-4 text-blue-600" />}
            </div>
            <p className="mt-3 text-3xl font-black">{value || 'View'}</p>
            <p className="mt-1 text-xs text-slate-500">Authorised information only</p>
          </div>
        ))}
      </section>

      <section className="mt-7">
        <h2 className="text-xl font-black">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map(([label, href]) => (
            <Link className="card flex items-center justify-between p-5 font-bold hover:border-blue-300 hover:text-blue-600 transition" href={href} key={label}>
              <span>{label}</span>
              <ArrowRight className="h-4 w-4 text-blue-600" />
            </Link>
          ))}
        </div>
      </section>

      {/* Blue Appointment Feature Box on Dashboard */}
      <section className="card mt-7 bg-gradient-to-br from-blue-600 to-indigo-800 p-6 text-white shadow-lg border-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
              <Calendar className="h-4 w-4" /> Book & Track Clinical Appointments
            </div>
            <h3 className="mt-2 text-xl font-black">Schedule Doctor Consultations with PID</h3>
            <p className="mt-1 text-xs text-blue-100 max-w-xl">
              Select patient by unique PID, assign medical specialists, and store appointment records directly in the Supabase database.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-blue-900 shadow hover:bg-blue-50 transition"
            >
              <Plus className="h-4 w-4 text-blue-700" /> Book Appointment Now
            </button>
            <Link
              href="/appointments"
              className="inline-flex items-center gap-1 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/30 transition"
            >
              View List <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="card mt-7 p-5">
        <h2 className="font-black">AI-Assisted Risk Screening</h2>
        <p className="mt-2 text-sm text-slate-600">
          Risk indicators use recorded symptoms, vitals and medical history to support a doctor review. This is clinical decision support, not a diagnosis.
        </p>
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <WifiOff className="h-4 w-4" /> Data entered offline is stored locally and synchronizes securely when connectivity is restored.
      </p>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newAppt) => {
          setNotice(`Appointment successfully scheduled for ${newAppt.patient?.name || 'Patient'} and stored in database!`);
          setTimeout(() => setNotice(''), 4000);
        }}
      />
    </DashboardShell>
  );
}
