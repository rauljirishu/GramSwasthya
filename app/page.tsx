'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  Globe, 
  HeartPulse, 
  MapPin, 
  ShieldCheck, 
  Users, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Stethoscope,
  Building2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useSettings } from '@/lib/context/settings-context';
import { languageOptions, type SupportedLanguage } from '@/lib/i18n/translations';
import { EmergencySosModal } from '@/components/emergency-sos-modal';
import { NearbyPHCFinder, type PHCChoice } from '@/components/nearby-phc-finder';

export default function Home() {
  const { language, setLanguage } = useSettings();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Form State for Guest Booking
  const [village, setVillage] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [purpose, setPurpose] = useState('General PHC Wellness Checkup');
  
  const [selectedPHC, setSelectedPHC] = useState<PHCChoice | null>(null);

  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Public Appointment Submission
  async function handlePublicBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!appointmentDate) {
      setErrorMsg('Please choose your preferred appointment date.');
      return;
    }
    if (!selectedPHC) {
      setErrorMsg('Find and select a nearby PHC before booking.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to your patient account before booking. A PHC Worker must create and link your Patient ID.');
      const { data: account, error: accountError } = await supabase
        .from('patient_accounts')
        .select('patient_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (accountError) throw accountError;
      if (!account?.patient_id) throw new Error('Your patient account is not linked to a PHC record yet. Ask your PHC Worker to register and link your Patient ID.');

      const { error: apptErr } = await supabase
        .from('appointments')
        .insert({
          patient_id: account.patient_id,
          facility_id: selectedPHC.facilityId || null,
          preferred_facility_name: selectedPHC.name,
          preferred_facility_address: selectedPHC.address,
          preferred_facility_latitude: selectedPHC.latitude,
          preferred_facility_longitude: selectedPHC.longitude,
          preferred_facility_phone: selectedPHC.phone || null,
          appointment_date: appointmentDate,
          purpose: purpose,
          clinical_notes: `Patient self-scheduled visit. Preferred PHC: ${selectedPHC.name}; ${selectedPHC.address}; ${selectedPHC.distanceKm.toFixed(1)} km away. ${selectedPHC.phone ? `Contact: ${selectedPHC.phone}` : ''}`,
          status: 'scheduled'
        });

      if (apptErr) throw apptErr;

      setBookingSuccess(`Appointment booked successfully for your linked PHC patient record. Preferred location: ${selectedPHC.name}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete appointment booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8fc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-3 text-xl font-black text-blue-600 dark:text-blue-400">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-2xl text-white shadow-md">+</span>
          GramCare
        </div>

        <div className="flex items-center gap-3">
          {/* Multi-Language Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold shadow-sm">
            <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="bg-transparent text-xs font-extrabold outline-none cursor-pointer"
            >
              {languageOptions.map(opt => (
                <option value={opt.code} key={opt.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Emergency SOS Button */}
          <button
            onClick={() => setShowSosModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3.5 py-2 shadow-lg animate-pulse"
          >
            <AlertTriangle className="h-4 w-4" /> Emergency SOS
          </button>

          {/* Sign In & Book CTA */}
          <button
            onClick={() => { setBookingSuccess(null); setShowAppointmentModal(true); }}
            className="hidden sm:inline-flex items-center gap-1.5 primary-btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2"
          >
            <Calendar className="h-4 w-4" /> Book Appointment
          </button>

          <div className="flex items-center gap-2">
            <Link href="/login?mode=patient" className="secondary-btn py-2 text-xs font-extrabold">
              Login as a patient
            </Link>
            <Link href="/login" className="secondary-btn py-2 text-xs font-extrabold">Sign in</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-950 px-3.5 py-1 text-xs font-extrabold text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
            <HeartPulse className="h-4 w-4 text-blue-600" /> Connected Rural Healthcare Across India
          </span>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Care continuity from village to hospital.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            GramCare connects rural health workers, Primary Health Centres (PHCs), duty doctors, and hospitals through unified digital healthcare workflows.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {/* Prominent Public Book Appointment CTA */}
            <button
              onClick={() => { setBookingSuccess(null); setShowAppointmentModal(true); }}
              className="primary-btn bg-blue-600 hover:bg-blue-700 text-white text-base py-3 px-6 font-black shadow-xl"
            >
              <Calendar className="h-5 w-5" /> Book Appointment Without Login
            </button>

            <button
              onClick={() => setShowSosModal(true)}
              className="secondary-btn border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold"
            >
              <AlertTriangle className="h-4 w-4 text-rose-600" /> Emergency SOS Alert
            </button>

            <Link href="/login" className="secondary-btn font-extrabold">
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-5 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Patient information is encrypted and accessible to authorized healthcare practitioners.
          </p>
        </div>

        {/* Workflow Showcase Box */}
        <div id="workflow" className="card bg-gradient-to-br from-blue-700 via-indigo-900 to-slate-900 p-8 text-white shadow-2xl">
          <p className="text-xs font-bold tracking-wider text-blue-200 uppercase">HOW GRAMCARE WORKS</p>
          <h2 className="mt-2 text-2xl font-black">7-Step Integrated Continuum of Care</h2>
          
          <div className="mt-6 space-y-2.5">
            {[
              '1. Public/Field Patient Registration & Unique PID Assignment',
              '2. Health Record Assessment & Vitals Logging',
              '3. AI-Assisted Clinical Risk Screening',
              '4. PHC Duty Doctor Consultation & Review',
              '5. Digital PHC-to-Hospital Referral with PID',
              '6. Specialist Hospital Care & Treatment',
              '7. Community Follow-up & Medication Reminders'
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3 rounded-xl bg-white/10 p-2.5 backdrop-blur">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-blue-900 text-xs font-black">
                  {i + 1}
                </span>
                <span className="font-bold text-xs sm:text-sm">{step}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 rounded-xl bg-white/10 p-4 text-xs font-semibold text-blue-100 border border-white/10">
            Patient → Health Worker → PHC → Doctor → Hospital → Follow-up
          </p>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="eyebrow">BUILT FOR PRACTICAL FIELD & CLINICAL CARE</p>
          <h2 className="mt-2 text-3xl font-black">Record · Screen · Review · Refer · Treat · Follow-up</h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              [ShieldCheck, 'Unique Patient PID System', 'Every patient receives a unique PID for seamless inter-PHC transfers and referrals.'],
              [MapPin, 'Live GPS Nearest PHC Suggester', 'Automatically detect your location to find the closest Primary Health Centre across India.'],
              [HeartPulse, 'Emergency SOS Alerts', 'Direct emergency dispatch to nearest PHCs with single-click location sharing.'],
              [Users, 'Digital Referrals & Store', 'Instant PHC to hospital referrals with full medical report store access.'],
              [Clock, 'Prescription Reminders', 'Automated dosage reminders and alerts for continuous patient medication compliance.'],
              [Globe, 'All Indian Languages', 'Fully localized interface supporting 11 major Indian regional languages.']
            ].map(([Icon, title, text]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <article className="card p-6 border-slate-200 dark:border-slate-800" key={title as string}>
                  <I className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="mt-4 font-black text-slate-900 dark:text-white">{title as string}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{text as string}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Public Appointment Booking Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 overflow-y-auto backdrop-blur-sm animate-in fade-in">
          <div className="card w-full max-w-2xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="rounded-full bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 text-[10px] font-black text-blue-800 dark:text-blue-200 uppercase">
                  PATIENT ACCOUNT REQUIRED
                </span>
                <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Book PHC Clinical Appointment</h2>
                <p className="text-xs text-slate-500">Sign in with your linked patient account to schedule at a nearby Primary Health Centre. PHC Workers create Patient IDs.</p>
              </div>
              <button onClick={() => setShowAppointmentModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-6 w-6" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-300 p-6 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 text-center space-y-4">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                <h3 className="text-lg font-black">{bookingSuccess}</h3>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="primary-btn bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handlePublicBooking} className="mt-4 space-y-4">
                {errorMsg && (
                  <div className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
                    {errorMsg}
                  </div>
                )}

                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/40">
                  <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">Find your nearest centre by GPS or search State → District → City/Village/Pincode. You choose the facility before booking.</p>
                  <NearbyPHCFinder onSelect={facility => { setSelectedPHC(facility); setErrorMsg(''); }} />
                  {selectedPHC && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">Selected PHC: {selectedPHC.name} · {selectedPHC.distanceKm.toFixed(1)} km · {selectedPHC.address}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-xs font-bold">
                  <label className="block">
                    Village / Area
                    <input
                      type="text"
                      value={village}
                      onChange={e => setVillage(e.target.value)}
                      placeholder="e.g. Rampur Village"
                      className="input mt-1 text-xs"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    Preferred Appointment Date <span className="text-rose-500">*</span>
                    <input
                      required
                      type="date"
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                      className="input mt-1 text-xs font-semibold"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    Purpose of Visit
                    <select
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      className="input mt-1 text-xs"
                    >
                      <option value="General PHC Wellness Checkup">General PHC Wellness Checkup</option>
                      <option value="Blood Pressure & Sugar Screening">Blood Pressure & Sugar Screening</option>
                      <option value="Maternal & ANC Checkup">Maternal & ANC Checkup</option>
                      <option value="Prescription & Medicine Review">Prescription & Medicine Review</option>
                      <option value="Child Vaccination Session">Child Vaccination Session</option>
                      <option value="Fever & Symptom Check">Fever & Symptom Check</option>
                    </select>
                  </label>

                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={() => setShowAppointmentModal(false)} className="secondary-btn text-xs">
                    Cancel
                  </button>
                  <button
                    disabled={submitting}
                    className="primary-btn bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 shadow-lg"
                  >
                    {submitting ? 'Booking...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Emergency SOS Modal */}
      <EmergencySosModal isOpen={showSosModal} onClose={() => setShowSosModal(false)} />
    </main>
  );
}
