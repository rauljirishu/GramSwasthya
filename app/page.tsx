'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  Cloud, 
  HeartPulse, 
  MapPin, 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  Plus, 
  CheckCircle2, 
  User 
} from 'lucide-react';
import { ContinueDashboard } from '@/components/continue-dashboard';
import { BookAppointmentModal } from '@/components/book-appointment-modal';

const capabilities = [
  [ShieldCheck, 'Patient Records & Unique PID', 'Longitudinal health information with unique PID identifiers and role-based access.'],
  [Calendar, 'Book Clinical Appointments', 'Schedule consultations with doctors and PHC specialists stored securely in the database.'],
  [Cloud, 'Offline-First Data Entry', 'Securely queue field records and synchronize when connectivity returns.'],
  [HeartPulse, 'AI-Assisted Risk Screening', 'Clinical decision support and risk indicators for authorised review.'],
  [Users, 'Digital Referrals', 'Coordinate care between PHCs, doctors and hospitals.'],
  [MapPin, 'Nearby Healthcare Services', 'Use device location or a manual location to find care.']
];

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState('');

  return (
    <main className="min-h-screen bg-[#f5f8fc] dark:bg-slate-950 transition-colors">
      {/* Header Toolbar */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3 text-xl font-black text-slate-900 dark:text-white">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-2xl text-white shadow-md shadow-blue-500/20">+</span>
          GramCare
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="secondary-btn py-2.5 text-sm">Sign in</Link>
          <Link href="/signup" className="primary-btn py-2.5 text-sm">Create account</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-2 lg:py-16">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 px-3.5 py-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Connected Healthcare for Rural Communities
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Care continuity from village to hospital.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            GramCare connects rural health workers, PHCs, doctors and hospitals through secure digital healthcare workflows, unique Patient IDs (PID), and instant appointment scheduling.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-6 py-3.5 text-base font-extrabold text-white shadow-lg shadow-blue-500/25 transition-all"
            >
              <Calendar className="h-5 w-5" />
              <span>Book Appointment</span>
            </button>
            <Link href="/appointments" className="secondary-btn py-3.5">
              <span>View Appointments</span> <ArrowRight className="h-4 w-4" />
            </Link>
            <ContinueDashboard />
          </div>

          {notice && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-200 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{notice}</span>
            </div>
          )}

          <p className="mt-5 text-sm font-semibold text-slate-500">
            Patient information is accessible only to authorised users with unique PID tracking.
          </p>
        </div>

        {/* PROMINENT BLUE BOOK APPOINTMENT CARD (User Requested Blue Box on Front Page) */}
        <div className="card bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-7 text-white shadow-xl shadow-blue-600/20 border-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur">
                <Calendar className="h-3.5 w-3.5 text-blue-200" /> CLINICAL APPOINTMENT SCHEDULER
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Instant Database Sync</span>
            </div>

            <h2 className="mt-5 text-2xl font-black text-white">Book Doctor & PHC Consultations</h2>
            <p className="mt-2 text-sm text-blue-100 leading-relaxed">
              Schedule specialist checkups, maternal care reviews, and follow-ups with unique Patient IDs (PID). Instantly stored and displayed in your clinical record list.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur border border-white/10">
                <User className="h-5 w-5 text-blue-200 shrink-0" />
                <div className="text-xs">
                  <p className="font-extrabold text-white">Unique PID Identification</p>
                  <p className="text-blue-200">Verified patient lookup (e.g. GC-2026-1001)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur border border-white/10">
                <Stethoscope className="h-5 w-5 text-blue-200 shrink-0" />
                <div className="text-xs">
                  <p className="font-extrabold text-white">Specialist & PHC Assignment</p>
                  <p className="text-blue-200">Connect with doctors, CHCs & District Hospitals</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur border border-white/10">
                <Clock className="h-5 w-5 text-blue-200 shrink-0" />
                <div className="text-xs">
                  <p className="font-extrabold text-white">Real-Time Database Storage</p>
                  <p className="text-blue-200">Instant updates across all healthcare dashboards</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-blue-900 shadow-md hover:bg-blue-50 active:scale-[0.98] transition"
            >
              <Plus className="h-4 w-4 text-blue-700" /> Book Appointment Now
            </button>
            <Link
              href="/appointments"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-white/15 px-5 py-3.5 text-sm font-bold text-white hover:bg-white/25 transition"
            >
              View List <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="eyebrow">Built for practical field care</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Record · Screen · Review · Refer · Treat · Follow-up</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {capabilities.map(([Icon, title, text]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <article className="card p-6 hover:border-blue-300 dark:hover:border-blue-700 transition" key={title as string}>
                  <I className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="mt-4 font-black text-slate-900 dark:text-white">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text as string}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newAppt) => {
          setNotice(`Appointment created for ${newAppt.patient?.name || 'Patient'} and stored in database!`);
          setTimeout(() => setNotice(''), 4000);
        }}
      />
    </main>
  );
}
