'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { GramRole, roleLabels } from '@/lib/grams-data';
import { currentRole } from '@/lib/auth';
import { BookAppointmentModal } from '@/components/book-appointment-modal';
import { useTranslation } from '@/lib/i18n/use-translation';
import { Activity, ArrowRight, Calendar, Plus, ShieldCheck, Users, WifiOff } from 'lucide-react';

export default function Dashboard() {
  const [role, setRole] = useState<GramRole>('central');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    currentRole().then(value => {
      if (value) setRole(value);
    });
  }, []);

  const statConfigs: Record<GramRole, Array<{ key: string; labelKey: string; defaultLabel: string; value: string }>> = {
    central: [
      { key: 'phcs', labelKey: 'totalPHCs', defaultLabel: 'Total PHCs', value: '—' },
      { key: 'workers', labelKey: 'healthcareWorkers', defaultLabel: 'Healthcare workers', value: '—' },
      { key: 'hospitals', labelKey: 'hospitalsCount', defaultLabel: 'Hospitals', value: '—' },
      { key: 'patients', labelKey: 'registeredPatients', defaultLabel: 'Registered patients', value: '—' },
      { key: 'referrals', labelKey: 'activeReferrals', defaultLabel: 'Active referrals', value: '—' },
      { key: 'followups', labelKey: 'followUpsDue', defaultLabel: 'Follow-ups due', value: '—' }
    ],
    head: [
      { key: 'phc_pts', labelKey: 'phcPatients', defaultLabel: 'PHC patients', value: '—' },
      { key: 'hw', labelKey: 'healthWorkers', defaultLabel: 'Health workers', value: '—' },
      { key: 'docs', labelKey: 'doctors', defaultLabel: 'Doctors', value: '—' },
      { key: 'hr', labelKey: 'highRiskCases', defaultLabel: 'High-risk cases', value: '—' },
      { key: 'ref', labelKey: 'pendingReferrals', defaultLabel: 'Pending referrals', value: '—' },
      { key: 'fol', labelKey: 'followUpsDue', defaultLabel: 'Follow-ups due', value: '—' }
    ],
    worker: [
      { key: 'asg', labelKey: 'assignedPatients', defaultLabel: 'Assigned patients', value: '—' },
      { key: 'sync', labelKey: 'recordsPendingSync', defaultLabel: 'Records pending sync', value: '0' },
      { key: 'fol', labelKey: 'followUpsDue', defaultLabel: 'Follow-ups due', value: '—' },
      { key: 'ref', labelKey: 'referralUpdates', defaultLabel: 'Referral updates', value: '—' }
    ],
    doctor: [
      { key: 'asg', labelKey: 'assignedPatients', defaultLabel: 'Assigned patients', value: '—' },
      { key: 'rev', labelKey: 'reviewsRequired', defaultLabel: 'Reviews required', value: '—' },
      { key: 'risk', labelKey: 'riskIndicators', defaultLabel: 'Risk indicators', value: '—' },
      { key: 'ref', labelKey: 'pendingReferrals', defaultLabel: 'Pending referrals', value: '—' }
    ],
    hospital: [
      { key: 'inc', labelKey: 'incomingReferrals', defaultLabel: 'Incoming referrals', value: '—' },
      { key: 'acc', labelKey: 'acceptedReferrals', defaultLabel: 'Accepted referrals', value: '—' },
      { key: 'act', labelKey: 'activeCases', defaultLabel: 'Active cases', value: '—' },
      { key: 'fol', labelKey: 'followUps', defaultLabel: 'Follow-ups', value: '—' }
    ],
    patient: [
      { key: 'rec', labelKey: 'myHealthRecord', defaultLabel: 'My health record', value: '' },
      { key: 'vis', labelKey: 'recentVisits', defaultLabel: 'Recent visits', value: '' },
      { key: 'ref', labelKey: 'referrals', defaultLabel: 'Referrals', value: '' },
      { key: 'fol', labelKey: 'followUpDate', defaultLabel: 'Follow-up date', value: '' }
    ]
  };

  const actions = role === 'worker'
    ? [
        { label: t('registerPatientAction', 'Register patient'), href: '/patients' },
        { label: t('bookAppointmentAction', 'Book appointment'), href: '/appointments' },
        { label: t('referralsAction', 'Referrals'), href: '/referrals' },
        { label: t('followUpsAction', 'Follow-ups'), href: '/follow-ups' }
      ]
    : role === 'patient'
    ? [
        { label: t('bookAppointmentAction', 'Book appointment'), href: '/appointments' },
        { label: t('myHealthAction', 'My health'), href: '/patient-dashboard' },
        { label: t('myReferralsAction', 'My referrals'), href: '/referrals' },
        { label: t('healthGuidanceAction', 'Health guidance'), href: '/health-education' }
      ]
    : [
        { label: t('bookAppointmentAction', 'Book appointment'), href: '/appointments' },
        { label: t('patientsAction', 'Patients'), href: '/patients' },
        { label: t('referralsAction', 'Referrals'), href: '/referrals' },
        { label: t('followUpsAction', 'Follow-ups'), href: '/follow-ups' }
      ];

  return (
    <DashboardShell>
      {/* Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 p-6 text-white sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-200">
              <ShieldCheck className="h-4 w-4" />{roleLabels[role]} {t('navDashboard', 'Dashboard')}
            </div>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              {t('dashboardTitle', 'Connected care for every village.')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              {t('dashboardDesc', 'GramCare supports secure healthcare continuity from field registration through clinical review, appointment booking, referral, treatment and follow-up.')}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] px-5 py-3 text-sm font-extrabold text-white shadow-lg transition"
          >
            <Plus className="h-4 w-4" /> {t('bookAppointmentBtn', 'Book Appointment')}
          </button>
        </div>
      </section>

      {notice && (
        <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs font-bold text-blue-800">
          {notice}
        </div>
      )}

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 dark:bg-blue-950/50 p-3 text-xs font-semibold text-blue-900 dark:text-blue-200">
        <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
        {t('privacyNotice', 'Patient information is accessible only to authorised users with unique PID tracking.')}
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statConfigs[role].map((item, i) => (
          <div className="card p-4" key={item.key}>
            <div className="flex justify-between text-slate-500">
              <span className="text-xs font-bold uppercase">{t(item.labelKey, item.defaultLabel)}</span>
              {i % 2 ? <Activity className="h-4 w-4 text-blue-600" /> : <Users className="h-4 w-4 text-blue-600" />}
            </div>
            <p className="mt-3 text-3xl font-black">{item.value || 'View'}</p>
            <p className="mt-1 text-xs text-slate-500">{t('authorisedInfoOnly', 'Authorised information only')}</p>
          </div>
        ))}
      </section>

      <section className="mt-7">
        <h2 className="text-xl font-black">{t('quickActions', 'Quick actions')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((item) => (
            <Link className="card flex items-center justify-between p-5 font-bold hover:border-blue-300 hover:text-blue-600 transition" href={item.href} key={item.href}>
              <span>{item.label}</span>
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
              <Calendar className="h-4 w-4" /> {t('bookAndTrackTitle', 'Book & Track Clinical Appointments')}
            </div>
            <h3 className="mt-2 text-xl font-black">{t('scheduleDoctorTitle', 'Schedule Doctor Consultations with PID')}</h3>
            <p className="mt-1 text-xs text-blue-100 max-w-xl">
              {t('scheduleDoctorDesc', 'Select patient by unique PID, assign medical specialists, and store appointment records directly in the Supabase database.')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-blue-900 shadow hover:bg-blue-50 transition"
            >
              <Plus className="h-4 w-4 text-blue-700" /> {t('bookAppointmentBtn', 'Book Appointment Now')}
            </button>
            <Link
              href="/appointments"
              className="inline-flex items-center gap-1 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/30 transition"
            >
              {t('navAppointments', 'View List')} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="card mt-7 p-5">
        <h2 className="font-black">{t('aiAssistedRiskTitle', 'AI-Assisted Risk Screening')}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t('aiAssistedRiskDesc', 'Risk indicators use recorded symptoms, vitals and medical history to support a doctor review. This is clinical decision support, not a diagnosis.')}
        </p>
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <WifiOff className="h-4 w-4" /> {t('offlineSyncNotice', 'Data entered offline is stored locally and synchronizes securely when connectivity is restored.')}
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
