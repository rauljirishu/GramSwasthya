'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { createPatientCode } from '@/lib/patient-id';
import { Plus, Search, ShieldCheck, X, ChevronDown, ChevronRight } from 'lucide-react';

type PatientRow = Record<string, any> & {
  id: string;
  patient_code: string | null;
  name: string;
  age: number;
  gender: string;
  village: string | null;
  blood_group: string | null;
  verification_status: string;
  facilities?: { name: string } | { name: string }[] | null;
};

const blank = {
  name: '', age: '', gender: 'female', phone: '', address: '', village: '', district: '',
  emergency_contact: '', blood_group: '', allergies: '', existing_conditions: '',
  previous_major_illnesses: '', current_medications: '', notes: ''
};
const listify = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);

function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None recorded';
  if (value && typeof value === 'object') return JSON.stringify(value);
  if (value === null || value === undefined || value === '') return 'Not recorded';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function labelFor(key: string) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function PatientsPage() {
  const [all, setAll] = useState<PatientRow[]>([]);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');

  async function load() {
    setLoading(true);
    const current = await import('@/lib/auth').then(module => module.currentRole());
    if (current) setRole(current);
    const { data, error } = await supabase
      .from('patients')
      .select('*, facilities(name)')
      .order('created_at', { ascending: false });
    if (error) setMessage(`Patient registry could not be loaded: ${error.message}`);
    else {
      setAll((data || []) as PatientRow[]);
      setMessage('');
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const patients = useMemo(() => all.filter(patient =>
    `${patient.name} ${patient.patient_code || ''} ${patient.village || ''} ${patient.district || ''}`
      .toLowerCase().includes(query.toLowerCase())
  ), [all, query]);

  function updateField(key: keyof typeof blank, value: string) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  async function registerPatient(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('users').select('facility_id,role').eq('id', user?.id || '').single();
    if (!user || role !== 'worker' || !profile?.facility_id || !['phc_worker', 'worker', 'asha', 'anm'].includes(profile.role)) {
      setMessage('Patient registration requires an authorised worker account assigned to a PHC.');
      setBusy(false);
      return;
    }
    const patientCode = createPatientCode();
    const { error } = await supabase.from('patients').insert({
      patient_code: patientCode,
      name: form.name.trim(),
      age: Number(form.age),
      gender: form.gender,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      village: form.village.trim(),
      district: form.district.trim() || null,
      emergency_contact: form.emergency_contact.trim() || null,
      blood_group: form.blood_group.trim() || null,
      allergies: listify(form.allergies),
      existing_conditions: listify(form.existing_conditions),
      previous_major_illnesses: listify(form.previous_major_illnesses),
      current_medications: listify(form.current_medications),
      notes: form.notes.trim() || null,
      registered_by: user.id,
      registered_phc_id: profile.facility_id,
      verification_status: 'verified'
    });
    setBusy(false);
    if (error) { setMessage(`Patient could not be registered: ${error.message}`); return; }
    setShowForm(false);
    setForm(blank);
    setMessage(`Patient record ${patientCode} registered successfully.`);
    await load();
  }

  const canRegister = role === 'worker';

  return (
    <DashboardShell>
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Authorised patient registry</p>
            <h1 className="mt-2 text-3xl font-black">All Patient Data</h1>
            <p className="mt-1 text-sm text-slate-600">Central Authority can review the complete patient registry across all PHCs.</p>
          </div>
          {canRegister && <button onClick={() => setShowForm(true)} className="primary-btn"><Plus className="h-4 w-4" />Register patient</button>}
        </header>

        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold text-blue-900">
          <ShieldCheck className="h-4 w-4 shrink-0" />Patient records are shown according to your role and database access policy.
        </div>
        {message && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-950">{message}</div>}

        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className="input py-2 text-sm" style={{ paddingLeft: '2.4rem' }} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, PID, village or district" />
            </div>
            <span className="text-xs font-bold text-slate-600">{loading ? 'Loading registry…' : `${patients.length} of ${all.length} patient records`}</span>
          </div>
          {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading authorised patient records…</div> : patients.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-600">{all.length ? 'No patients match your search.' : 'No patient records are visible to this account. If this is Central Authority, apply the latest Supabase access migration.'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Village / District</th><th className="px-4 py-3">PHC</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Details</th></tr></thead>
                <tbody>
                  {patients.map(patient => {
                    const isExpanded = expandedId === patient.id;
                    const facility = Array.isArray(patient.facilities) ? patient.facilities[0] : patient.facilities;
                    return <>
                      <tr key={patient.id} className="border-t border-slate-100">
                        <td className="px-4 py-4"><b>{patient.name}</b><span className="mt-1 block text-xs text-slate-500">{patient.patient_code || 'No PID'} · {patient.age} years · {patient.gender}</span></td>
                        <td className="px-4 py-4">{patient.village || 'Not recorded'}<span className="block text-xs text-slate-500">{patient.district || ''}</span></td>
                        <td className="px-4 py-4">{facility?.name || patient.phc_assigned || 'Not assigned'}</td>
                        <td className="px-4 py-4"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{patient.verification_status || 'Unverified'}</span></td>
                        <td className="px-4 py-4"><div className="flex items-center gap-3"><button type="button" onClick={() => setExpandedId(isExpanded ? null : patient.id)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}{isExpanded ? 'Hide' : 'Show all data'}</button>{patient.patient_code && <Link className="text-xs font-bold text-slate-600 hover:text-blue-700" href={`/patients/${encodeURIComponent(patient.patient_code)}`}>Health profile</Link>}</div></td>
                      </tr>
                      {isExpanded && <tr key={`${patient.id}-details`} className="border-t border-slate-100 bg-slate-50"><td colSpan={5} className="p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(patient).filter(([key, value]) => key !== 'facilities' && value !== null && value !== undefined && value !== '').map(([key, value]) => <div key={key} className="rounded-lg border border-slate-200 bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{labelFor(key)}</p><p className="mt-1 break-words text-xs font-semibold text-slate-800">{displayValue(value)}</p></div>)}</div></td></tr>}
                    </>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showForm && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4"><form onSubmit={registerPatient} className="card mx-auto my-6 w-full max-w-3xl p-6"><div className="flex justify-between"><div><h2 className="text-xl font-black">PHC Worker Patient Registration</h2><p className="mt-1 text-sm text-slate-600">A unique PID will be generated for this patient record.</p></div><button type="button" onClick={() => setShowForm(false)} aria-label="Close"><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{([['name','Full name'],['age','Age'],['phone','Contact number'],['village','Village'],['district','District / area'],['address','Address'],['emergency_contact','Emergency contact'],['blood_group','Blood group'],['allergies','Allergies (comma-separated)'],['existing_conditions','Existing conditions (comma-separated)'],['previous_major_illnesses','Previous illnesses (comma-separated)'],['current_medications','Current medicines (comma-separated)']] as [keyof typeof blank,string][]).map(([key,label])=><label key={key} className="text-sm font-bold">{label}<input required={['name','age','village'].includes(key)} type={key==='age'?'number':'text'} value={form[key]} onChange={event=>updateField(key,event.target.value)} className="input mt-1" /></label>)}<label className="text-sm font-bold">Gender<select value={form.gender} onChange={event=>updateField('gender',event.target.value)} className="input mt-1"><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option><option value="unknown">Not recorded</option></select></label><label className="text-sm font-bold sm:col-span-2">Clinical notes<textarea value={form.notes} onChange={event=>updateField('notes',event.target.value)} className="input mt-1 min-h-20" /></label></div><button disabled={busy} className="primary-btn mt-6">{busy?'Saving…':'Register patient'}</button></form></div>}
    </DashboardShell>
  );
}
