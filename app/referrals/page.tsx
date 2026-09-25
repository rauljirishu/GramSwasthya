'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { updateReferralStatus, getPatients } from '@/lib/api/doctor';
import type { ReferralStatus, PatientRow } from '@/lib/types';
import { 
  ClipboardList, 
  Search, 
  User, 
  ShieldCheck, 
  Building2, 
  Plus, 
  X, 
  ArrowRight,
  HeartPulse,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

type Referral = { 
  id: string; 
  reason: string; 
  status: ReferralStatus; 
  created_at: string; 
  referred_to_text: string | null; 
  clinical_notes: string | null; 
  patients?: { 
    id: string;
    name: string; 
    patient_code: string;
    age?: number;
    gender?: string;
    village?: string;
    blood_group?: string;
  } | null 
};

const nextStatus: Partial<Record<ReferralStatus, ReferralStatus>> = { 
  pending: 'accepted', 
  accepted: 'in_transit', 
  in_transit: 'arrived', 
  arrived: 'treatment_started', 
  treatment_started: 'completed' 
};

export default function ReferralsPage() {
  const [items, setItems] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [notice, setNotice] = useState('');
  const [show, setShow] = useState(false);

  // Search & PID Lookup state
  const [pidSearch, setPidSearch] = useState('');
  const [pidLookupResult, setPidLookupResult] = useState<any | null>(null);
  const [pidSearching, setPidSearching] = useState(false);
  const [pidSearchError, setPidSearchError] = useState('');

  // Referral form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [hospital, setHospital] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('id,reason,status,created_at,referred_to_text,clinical_notes,patients(id,name,patient_code,age,gender,village,blood_group)')
        .order('created_at', { ascending: false });

      if (error) console.error('Supabase getReferrals error:', error);
      setItems((data || []) as unknown as Referral[]);

      const pts = await getPatients();
      setPatients(pts || []);
    } catch (err) {
      console.error('Failed to load referrals:', err);
    }
  }

  useEffect(() => { 
    load(); 
  }, []);

  // Handle Lookup Patient by PID for Receiving PHC
  async function handleLookupPID() {
    if (!pidSearch.trim()) return;
    setPidSearching(true);
    setPidSearchError('');
    setPidLookupResult(null);

    try {
      const q = pidSearch.trim();
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*, clinical_records(*), health_records(*)')
        .or(`patient_code.ilike.%${q}%,id.eq.${q}`)
        .single();

      if (error || !patient) {
        setPidSearchError(`No patient record found matching PID "${q}".`);
      } else {
        setPidLookupResult(patient);
      }
    } catch (err: any) {
      setPidSearchError('Error querying patient by PID.');
    } finally {
      setPidSearching(false);
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { 
      setNotice('Authentication required to create a referral.'); 
      return; 
    }
    if (!selectedPatientId) {
      setNotice('Please select a patient with a valid PID.');
      return;
    }

    try {
      const { error } = await supabase.from('referrals').insert({ 
        patient_id: selectedPatientId, 
        referred_by: user.id, 
        referred_to_text: hospital.trim() || 'District Civil Hospital', 
        reason: reason.trim(), 
        clinical_notes: notes.trim() || null, 
        status: 'pending' 
      });

      if (error) { 
        setNotice(`Unable to create referral: ${error.message}`); 
        return; 
      }

      setShow(false); 
      setNotice('Referral created and sent to receiving facility!'); 
      setSelectedPatientId(''); 
      setHospital(''); 
      setReason(''); 
      setNotes(''); 
      await load();
    } catch (err: any) {
      setNotice(`Failed to create referral: ${err.message}`);
    }
  }

  async function advance(item: Referral) {
    const status = nextStatus[item.status];
    if (!status) return;
    setBusyId(item.id); 
    setNotice('');
    try { 
      await updateReferralStatus(item.id, status, { notes: `Status updated to ${status.replaceAll('_', ' ')}` }); 
      setNotice(`Referral status for ${item.patients?.name || 'Patient'} updated to ${status.replaceAll('_', ' ')}.`);
      await load(); 
    } catch (error) { 
      setNotice(error instanceof Error ? error.message : 'Unable to update referral status.'); 
    } finally { 
      setBusyId(''); 
    }
  }

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-blue-600" /> Inter-Facility Care Coordination
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">Inter-Facility Referrals</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Transfer care between PHCs, CHCs, specialists and District Hospitals securely using unique Patient IDs (PID).
          </p>
        </div>
        <button className="primary-btn" onClick={() => setShow(true)}>
          <Plus className="h-4 w-4" /> Create New Referral
        </button>
      </div>

      {notice && (
        <div role="status" className="mb-6 rounded-2xl bg-blue-50 dark:bg-blue-950/60 p-4 text-sm font-bold text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
          {notice}
        </div>
      )}

      {/* PID LOOKUP TOOL FOR RECEIVING PHC */}
      <section className="card p-5 mb-7 bg-gradient-to-br from-slate-900 to-blue-950 text-white border-0 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-300 border border-blue-400/30">
              <ShieldCheck className="h-3.5 w-3.5" /> SECURE PID MEDICAL LOOKUP FOR RECEIVING FACILITY
            </span>
            <h2 className="mt-3 text-xl font-black text-white">Find Referred Patient Details by PID</h2>
            <p className="mt-1 text-xs text-blue-200 max-w-xl">
              Authorized receiving PHC staff can enter a Patient ID (PID) to securely pull up the referred patient's required medical history, vitals, and treatment records.
            </p>
          </div>
          
          <div className="flex gap-2 min-w-[280px] sm:min-w-[340px]">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={pidSearch}
                onChange={(e) => setPidSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookupPID()}
                placeholder="Enter PID (e.g. GC-2026-1001)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-blue-400 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleLookupPID}
              disabled={pidSearching}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow hover:bg-blue-500 transition disabled:opacity-60 shrink-0"
            >
              {pidSearching ? 'Searching...' : 'Lookup PID'}
            </button>
          </div>
        </div>

        {/* PID Lookup Error */}
        {pidSearchError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-950/80 border border-rose-800 p-3 text-xs font-bold text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{pidSearchError}</span>
          </div>
        )}

        {/* PID Lookup Result Details Card */}
        {pidLookupResult && (
          <div className="mt-5 rounded-2xl bg-slate-800/90 p-5 border border-slate-700 space-y-4 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white font-black">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{pidLookupResult.name}</h3>
                  <p className="text-xs text-blue-200">PID: <strong className="text-white">{pidLookupResult.patient_code}</strong> · {pidLookupResult.village || 'PHC Sector'} · {pidLookupResult.age} yrs · {pidLookupResult.gender}</p>
                </div>
              </div>
              <Link
                href={`/patients/${pidLookupResult.patient_code || pidLookupResult.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition"
              >
                <span>View Full Clinical File</span> <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-700">
                <p className="font-extrabold text-blue-300">Blood Group & Vitals</p>
                <p className="mt-1 text-slate-300">Blood: {pidLookupResult.blood_group || 'Recorded in File'}</p>
                <p className="text-slate-300">Status: {pidLookupResult.verification_status || 'PHC Verified'}</p>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-700">
                <p className="font-extrabold text-blue-300">Allergies & Conditions</p>
                <p className="mt-1 text-slate-300">{pidLookupResult.allergies?.join(', ') || 'No known allergies'}</p>
                <p className="text-slate-300">{pidLookupResult.existing_conditions?.join(', ') || 'General review required'}</p>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-700">
                <p className="font-extrabold text-blue-300">Clinical History & Records</p>
                <p className="mt-1 text-slate-300">{pidLookupResult.clinical_records?.length || 0} Clinical Encounters</p>
                <p className="text-slate-300">{pidLookupResult.health_records?.length || 0} Vitals Checks</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Referrals List Table */}
      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Active Inter-Facility Referral Workflow</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Patient & PID</th>
                <th className="px-6 py-4">Receiving Facility</th>
                <th className="px-6 py-4">Clinical Reason</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-xs">
                    No inter-facility referrals found in the system. Click "Create New Referral" above to generate one.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition" key={item.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-blue-600 shrink-0" />
                        <div>
                          <Link 
                            href={item.patients?.patient_code ? `/patients/${item.patients.patient_code}` : '/patients'} 
                            className="font-extrabold text-slate-900 dark:text-white hover:text-blue-600 transition"
                          >
                            {item.patients?.name || 'Authorised Patient'}
                          </Link>
                          <span className="mt-0.5 block text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            PID: {item.patients?.patient_code || 'PID-RECORD'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {item.referred_to_text || 'GramCare Central Hospital'}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {item.reason}
                      {item.clinical_notes && (
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">{item.clinical_notes}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-950/80 px-3 py-1 text-xs font-black text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                        {item.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {nextStatus[item.status] ? (
                        <button 
                          disabled={busyId === item.id} 
                          onClick={() => advance(item)} 
                          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {busyId === item.id ? 'Saving...' : `Mark ${nextStatus[item.status]?.replaceAll('_', ' ')}`}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CREATE REFERRAL MODAL */}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={create} className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Create Inter-Facility Referral</h2>
                <p className="text-xs text-slate-500">Select patient by unique Patient ID (PID) to transfer care</p>
              </div>
              <button type="button" onClick={() => setShow(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Patient (PID)
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
                >
                  <option value="">-- Select Patient from Directory --</option>
                  {patients.map((p) => {
                    const pid = p.patient_code || `PID-${p.id.slice(0, 8).toUpperCase()}`;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} · PID: {pid} ({p.village || 'PHC'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Receiving Facility / Hospital
                </label>
                <input
                  required
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="e.g. Rampur CHC, District Civil Hospital..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason for Referral
                </label>
                <textarea
                  required
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. High Risk ANC review, Specialist Sonography required..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Clinical Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add vitals or medical history details for the receiving doctor..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShow(false)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Submit Inter-Facility Referral
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
