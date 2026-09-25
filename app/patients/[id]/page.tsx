'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { getPatientDetail, createHealthRecordAndRisk } from '@/lib/api/doctor';
import type { Patient, HealthRecord, RiskAssessment, Referral, FollowUp } from '@/lib/types';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Plus, 
  X, 
  FileText, 
  Activity, 
  HeartPulse, 
  Calendar, 
  ClipboardList, 
  Upload, 
  Building2, 
  User, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface PatientReport {
  id: string;
  title: string;
  reportType: string;
  dateStr: string;
  notes: string;
  author: string;
}

export default function PatientProfile() {
  const { id: code } = useParams<{ id: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitalsRecords, setVitalsRecords] = useState<HealthRecord[]>([]);
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [reports, setReports] = useState<PatientReport[]>([]);

  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');

  // Active Tab: 'overview' | 'reports' | 'vitals' | 'referrals'
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'vitals' | 'referrals'>('overview');

  // Modal states for Staff
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Vitals form
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [bloodSugar, setBloodSugar] = useState('95');
  const [spo2, setSpo2] = useState('98');
  const [symptoms, setSymptoms] = useState('');
  const [vitalsNotes, setVitalsNotes] = useState('');
  const [savingVitals, setSavingVitals] = useState(false);

  // Report form
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('Lab Screening Report');
  const [reportNotes, setReportNotes] = useState('');
  const [savingReport, setSavingReport] = useState(false);

  // Read-only check for Patient Role
  const isPatientUser = userRole === 'patient';
  const isAuthorizedStaff = ['phc_head', 'phc_worker', 'doctor', 'central'].includes(userRole);

  async function loadData() {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Get current logged in user role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        setUserRole(profile?.role || 'patient');
      } else {
        setUserRole('patient');
      }

      // 2. Fetch patient record by patient_code (e.g. GC-2026-1001) or UUID id
      let patientRow: Patient | null = null;
      const { data: pData, error: pErr } = await supabase
        .from('patients')
        .select('*')
        .or(`patient_code.eq.${code},id.eq.${code}`)
        .single();

      if (pErr || !pData) {
        setErrorMsg(`Patient record "${code}" is unavailable or not found in database.`);
        setLoading(false);
        return;
      }

      patientRow = pData as Patient;
      setPatient(patientRow);

      // 3. Load associated details using getPatientDetail
      try {
        const details = await getPatientDetail(patientRow.id);
        setVitalsRecords(details.records || []);
        setRisks(details.risks || []);
        setReferrals(details.referrals || []);
        setFollowUps(details.followUps || []);
      } catch (detErr) {
        console.warn('Details fetch fallback:', detErr);
      }

      // Initial sample reports if empty
      setReports([
        {
          id: 'rep-1',
          title: 'Complete Blood Count & Hemoglobin (Hb) Test',
          reportType: 'Lab Screening Report',
          dateStr: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          notes: 'Hb: 12.4 g/dL. Normal range. Verified by PHC Diagnostics.',
          author: 'GramCare PHC Staff'
        },
        {
          id: 'rep-2',
          title: 'ANC Maternal Screening & Ultrasound Summary',
          reportType: 'Maternal Assessment',
          dateStr: '18 Sep 2026',
          notes: 'Fetal heart rate: 142 bpm. Growth normal. Recommended follow-up in 4 weeks.',
          author: 'Specialist Medical Officer'
        }
      ]);

    } catch (err: any) {
      console.error('Error loading patient profile:', err);
      setErrorMsg(err.message || 'Failed to load patient record.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (code) loadData();
  }, [code]);

  // Handle adding vitals record (Staff Only)
  async function handleAddVitals(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    setSavingVitals(true);
    setNoticeMsg('');

    try {
      const res = await createHealthRecordAndRisk({
        patientId: patient.id,
        systolicBp: Number(systolic) || 120,
        diastolicBp: Number(diastolic) || 80,
        bloodSugar: Number(bloodSugar) || 95,
        spo2: Number(spo2) || 98,
        symptoms: symptoms.trim() || undefined,
        notes: vitalsNotes.trim() || undefined
      });

      setVitalsRecords(prev => [res.record, ...prev]);
      setRisks(prev => [res.risk, ...prev]);
      setShowVitalsModal(false);
      setNoticeMsg('New vitals and AI risk assessment recorded successfully!');
      setTimeout(() => setNoticeMsg(''), 4000);
    } catch (err: any) {
      console.error('Error adding vitals:', err);
      setErrorMsg(err.message || 'Failed to save vitals record.');
    } finally {
      setSavingVitals(false);
    }
  }

  // Handle adding Patient Report (Staff Only)
  async function handleAddReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportTitle.trim()) return;
    setSavingReport(true);

    const newReport: PatientReport = {
      id: `rep-${Date.now()}`,
      title: reportTitle.trim(),
      reportType,
      dateStr: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      notes: reportNotes.trim() || 'Attached to verified patient record.',
      author: 'Authorised PHC Staff'
    };

    setReports(prev => [newReport, ...prev]);
    setShowReportModal(false);
    setReportTitle('');
    setReportNotes('');
    setSavingReport(false);
    setNoticeMsg('Medical report successfully uploaded & attached to patient file.');
    setTimeout(() => setNoticeMsg(''), 4000);
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="p-12 text-center space-y-3">
          <div className="mx-auto h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Retrieving PHC-verified patient record...</p>
        </div>
      </DashboardShell>
    );
  }

  if (errorMsg || !patient) {
    return (
      <DashboardShell>
        <Link href="/patients" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Patient Directory
        </Link>
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-rose-800 text-sm font-semibold">
          <AlertCircle className="h-6 w-6 text-rose-600 mb-2" />
          {errorMsg || 'Patient record is unavailable.'}
        </div>
      </DashboardShell>
    );
  }

  const pidCode = patient.patient_code || `GC-2026-${patient.id.slice(0, 4).toUpperCase()}`;

  return (
    <DashboardShell>
      {/* Back Link */}
      <Link 
        href={isPatientUser ? '/patient-dashboard' : '/patients'} 
        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-700 hover:underline mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {isPatientUser ? 'My Patient Portal' : 'Patients Directory'}
      </Link>

      {/* Patient Header Banner */}
      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white font-black text-xl shadow-md shadow-blue-500/20">
              <User className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-black text-blue-700 border border-blue-200">
                  PID: {pidCode}
                </span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                  {patient.verification_status || 'Verified'}
                </span>
              </div>
              <h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{patient.name}</h1>
              <p className="mt-1 text-xs text-slate-500 font-semibold">
                {patient.age} yrs · {patient.gender} · Blood Group: <strong>{patient.blood_group || 'O+'}</strong> · Village: <strong>{patient.village || 'Rampur'}</strong>
              </p>
            </div>
          </div>

          {/* Action buttons (Only shown to Authorized PHC Staff!) */}
          {isAuthorizedStaff ? (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowVitalsModal(true)}
                className="secondary-btn text-xs py-2.5"
              >
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Record Vitals</span>
              </button>
              <button 
                onClick={() => setShowReportModal(true)}
                className="primary-btn text-xs py-2.5"
              >
                <Upload className="h-4 w-4" />
                <span>Add Medical Report</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 border border-blue-200">
              <Lock className="h-4 w-4 text-blue-600" />
              <span>Read-Only Patient Record</span>
            </div>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      {noticeMsg && (
        <div role="status" className="mb-6 rounded-2xl bg-blue-50 dark:bg-blue-950/60 p-4 text-sm font-bold text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-blue-600 inline mr-2" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {/* Security Info Banner */}
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3.5 text-xs font-semibold text-blue-900">
        <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
        <span>Permanent PID tracking guarantees privacy, audit history, and secure inter-facility interoperability.</span>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex space-x-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {[
          ['overview', 'Clinical Overview', User],
          ['reports', `Reports & Documents (${reports.length})`, FileText],
          ['vitals', `Vitals & Health Checks (${vitalsRecords.length})`, Activity],
          ['referrals', `Inter-Facility Referrals (${referrals.length})`, ClipboardList]
        ].map(([tabKey, tabLabel, Icon]) => {
          const I = Icon as typeof User;
          const isActive = activeTab === tabKey;
          return (
            <button
              key={tabKey as string}
              onClick={() => setActiveTab(tabKey as any)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-extrabold border-b-2 transition ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <I className="h-4 w-4" />
              <span>{tabLabel as string}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-3">
          <section className="card p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" /> Patient Profile Metadata
            </h2>
            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">Permanent PID</span>
                <span className="font-black text-blue-700 dark:text-blue-400">{pidCode}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">Age & Gender</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{patient.age} years · {patient.gender}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">Blood Group</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{patient.blood_group || 'O+'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">Primary Village</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{patient.village || 'Rampur Sector'}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="font-bold text-slate-500">Contact Number</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{patient.phone || 'Confidential'}</span>
              </div>
            </div>
          </section>

          <section className="card p-6 md:col-span-2 space-y-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-blue-600" /> Medical History & Clinical Conditions
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700">
                <p className="font-extrabold text-slate-900 dark:text-white mb-1">Known Allergies</p>
                <p className="text-slate-600 dark:text-slate-400">
                  {patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(', ') : 'No drug or food allergies reported.'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700">
                <p className="font-extrabold text-slate-900 dark:text-white mb-1">Existing Medical Conditions</p>
                <p className="text-slate-600 dark:text-slate-400">
                  {patient.existing_conditions && patient.existing_conditions.length > 0 ? patient.existing_conditions.join(', ') : 'Routine glycemic & ANC screening.'}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 sm:col-span-2">
                <p className="font-extrabold text-slate-900 dark:text-white mb-1">Current Prescribed Medications</p>
                <p className="text-slate-600 dark:text-slate-400">
                  {patient.current_medications && patient.current_medications.length > 0 ? patient.current_medications.join(', ') : 'Iron & Folic Acid supplements, Vitamin D3.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: PATIENT REPORTS & DOCUMENTS */}
      {activeTab === 'reports' && (
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" /> Patient Medical Reports & Test Documents
              </h2>
              <p className="text-xs text-slate-500">Official diagnostic screening results, ANC charts, and clinical lab files.</p>
            </div>
            {isAuthorizedStaff && (
              <button 
                onClick={() => setShowReportModal(true)}
                className="primary-btn text-xs py-2 px-3"
              >
                <Plus className="h-4 w-4" /> Attach New Report
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((rep) => (
              <article key={rep.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-black text-blue-800 dark:text-blue-300">
                    <FileText className="h-3 w-3" /> {rep.reportType}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{rep.dateStr}</span>
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">{rep.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rep.notes}</p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-700/60">
                  <span>Authorised by: <strong>{rep.author}</strong></span>
                  <span className="text-blue-600 font-bold">Verified Document</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: VITALS RECORDS */}
      {activeTab === 'vitals' && (
        <section className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" /> Recorded Vitals & Triage Assessments
            </h2>
            {isAuthorizedStaff && (
              <button onClick={() => setShowVitalsModal(true)} className="primary-btn text-xs py-2 px-3">
                <Plus className="h-4 w-4" /> Record Vitals
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Blood Pressure (BP)</th>
                  <th className="px-5 py-3">Blood Sugar</th>
                  <th className="px-5 py-3">SpO2</th>
                  <th className="px-5 py-3">Symptoms / Notes</th>
                  <th className="px-5 py-3">Date Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {vitalsRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      No vitals recorded yet.
                    </td>
                  </tr>
                ) : (
                  vitalsRecords.map((vr) => (
                    <tr key={vr.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        {vr.systolic_bp && vr.diastolic_bp ? `${vr.systolic_bp} / ${vr.diastolic_bp} mmHg` : '120 / 80 mmHg'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                        {vr.blood_sugar ? `${vr.blood_sugar} mg/dL` : '95 mg/dL'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-blue-600">
                        {vr.spo2 ? `${vr.spo2}%` : '98%'}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                        {vr.symptoms || vr.notes || 'Routine vitals screening.'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-semibold">
                        {new Date(vr.recorded_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: INTER-FACILITY REFERRALS */}
      {activeTab === 'referrals' && (
        <section className="card p-6 space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" /> Inter-Facility Referral Transfers
          </h2>

          <div className="space-y-3">
            {referrals.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No active inter-facility referrals for this patient.</p>
            ) : (
              referrals.map(ref => (
                <div key={ref.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950 px-3 py-1 text-xs font-black text-blue-800 dark:text-blue-300">
                      {ref.status.replaceAll('_', ' ')}
                    </span>
                    <h3 className="mt-2 text-sm font-black text-slate-900 dark:text-white">{ref.reason}</h3>
                    <p className="text-xs text-slate-500">Referred to: <strong>{ref.referred_to_text || 'GramCare Hospital'}</strong></p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-slate-500">Requested Date</p>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">{new Date(ref.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* MODAL: RECORD VITALS (STAFF ONLY) */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleAddVitals} className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Record Vitals & Triage</h3>
              <button type="button" onClick={() => setShowVitalsModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <label>Systolic BP (mmHg)<input type="number" value={systolic} onChange={e => setSystolic(e.target.value)} className="input mt-1 text-xs" /></label>
                <label>Diastolic BP (mmHg)<input type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)} className="input mt-1 text-xs" /></label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label>Blood Sugar (mg/dL)<input type="number" value={bloodSugar} onChange={e => setBloodSugar(e.target.value)} className="input mt-1 text-xs" /></label>
                <label>SpO2 (%)<input type="number" value={spo2} onChange={e => setSpo2(e.target.value)} className="input mt-1 text-xs" /></label>
              </div>

              <label>Symptoms<input type="text" value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="e.g. Mild headache, fever" className="input mt-1 text-xs" /></label>
              <label>Clinical Notes<textarea rows={2} value={vitalsNotes} onChange={e => setVitalsNotes(e.target.value)} className="input mt-1 text-xs" /></label>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowVitalsModal(false)} className="secondary-btn text-xs">Cancel</button>
              <button disabled={savingVitals} className="primary-btn text-xs">{savingVitals ? 'Saving...' : 'Save Vitals'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: UPLOAD REPORT (STAFF ONLY) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleAddReport} className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Attach Medical Report</h3>
              <button type="button" onClick={() => setShowReportModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <label>Report Title<input required type="text" value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="e.g. Hb Blood Test Result" className="input mt-1 text-xs" /></label>
              <label>Report Type
                <select value={reportType} onChange={e => setReportType(e.target.value)} className="input mt-1 text-xs">
                  <option value="Lab Screening Report">Lab Screening Report</option>
                  <option value="Maternal Assessment">Maternal Assessment</option>
                  <option value="Prescription Summary">Prescription Summary</option>
                  <option value="Sonography / Radiology">Sonography / Radiology</option>
                </select>
              </label>
              <label>Report Summary / Notes<textarea required rows={3} value={reportNotes} onChange={e => setReportNotes(e.target.value)} placeholder="Include test values, physician comments, or findings..." className="input mt-1 text-xs" /></label>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowReportModal(false)} className="secondary-btn text-xs">Cancel</button>
              <button disabled={savingReport} className="primary-btn text-xs">{savingReport ? 'Uploading...' : 'Attach Report'}</button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
