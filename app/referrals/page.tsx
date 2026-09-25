'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { updateReferralStatus } from '@/lib/api/doctor';
import type { ReferralStatus } from '@/lib/types';
import { useSettings } from '@/lib/context/settings-context';
import { uiLabels } from '@/lib/i18n/ui-labels';
import { useGramCareRealtime } from '@/lib/realtime/use-gramcare-realtime';

type Referral = { id: string; patient_id: string; reason: string; status: ReferralStatus; created_at: string; referred_to_text: string | null; clinical_notes: string | null; patient?: { name: string; patient_code: string } };
const nextStatus: Partial<Record<ReferralStatus, ReferralStatus>> = { pending: 'accepted', accepted: 'in_transit', in_transit: 'arrived', arrived: 'treatment_started', treatment_started: 'completed' };

export default function Referrals() {
  const realtime = useGramCareRealtime(() => { load(); });
  const [items, setItems] = useState<Referral[]>([]);
  const [notice, setNotice] = useState('');
  const [show, setShow] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [hospital, setHospital] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const { language } = useSettings();
  const labels = uiLabels(language);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('referrals').select('id,patient_id,reason,status,created_at,referred_to_text,clinical_notes').order('created_at', { ascending: false });
    if (error) setNotice(`Unable to load authorised referrals: ${error.message}`);
    else {
      const referrals = (data || []) as Referral[];
      const patientIds = [...new Set(referrals.map(item => item.patient_id))];
      const { data: patients } = patientIds.length ? await supabase.from('patients').select('id,name,patient_code').in('id', patientIds) : { data: [] };
      const patientMap = new Map((patients || []).map(patient => [patient.id, { name: patient.name, patient_code: patient.patient_code }]));
      setItems(referrals.map(item => ({ ...item, patient: patientMap.get(item.patient_id) })));
    }
    setLoading(false);
  }
  useEffect(() => { import('@/lib/auth').then(({ currentRole }) => currentRole().then(value => setRole(value || ''))); load(); }, []);
  const canCreate = role === 'worker';
  const canManage = ['worker', 'doctor', 'hospital'].includes(role);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (role !== 'worker') { setNotice('Only an assigned PHC Worker can create a referral.'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice('Authentication required to create a referral.'); return; }
    const { error } = await supabase.from('referrals').insert({ patient_id: patientId, referred_by: user.id, referred_to_text: hospital, reason, clinical_notes: notes, status: 'pending' });
    if (error) { setNotice(`Unable to create referral: ${error.message}`); return; }
    setShow(false); setNotice('Referral created and awaiting the receiving facility.'); setPatientId(''); setHospital(''); setReason(''); setNotes(''); await load();
  }

  async function advance(item: Referral) {
    const status = nextStatus[item.status];
    if (!status || !canManage) return;
    setBusyId(item.id); setNotice('');
    try {
      const details = role === 'worker' ? { notes: `Status advanced to ${status.replaceAll('_', ' ')}` } : undefined;
      await updateReferralStatus(item.id, status, details);
      await load();
    }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to update referral status.'); }
    finally { setBusyId(''); }
  }

  const [registeredPatients, setRegisteredPatients] = useState<{ id: string; name: string; patient_code: string | null; village: string | null }[]>([]);

  async function openCreateModal() {
    if (role !== 'worker') return;
    setShow(true);
    const { data: pts } = await supabase.from('patients').select('id, name, patient_code, village').order('name');
    if (pts && pts.length) {
      setRegisteredPatients(pts);
      if (!patientId) setPatientId(pts[0].id);
    }
  }

  return <DashboardShell>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Care coordination</p><h1 className="mt-2 text-3xl font-black">{labels.referrals}</h1><p className="mt-1 text-sm text-slate-600">{role === 'patient' ? 'Your linked referral history (read-only).' : 'PHC to receiving facility: accepted, in transit, arrived, treatment and completion.'}</p></div>{canCreate && <button className="primary-btn" onClick={openCreateModal}>{labels.createReferral}</button>}</div>
    {notice && <p role="status" className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-800">{notice}</p>}
    <section className="card mt-6 overflow-x-auto">{loading ? <p className="p-8 text-center text-sm text-slate-500">{labels.loading}</p> : items.length === 0 ? <div className="p-8 text-center text-sm text-slate-500"><p>{labels.noReferrals}</p><button onClick={load} className="secondary-btn mt-4">{labels.retry}</button></div> : <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Patient</th><th className="p-4">Receiving facility</th><th className="p-4">Reason</th><th className="p-4">Status</th>{canManage && <th className="p-4">Action</th>}</tr></thead><tbody>{items.map(item => <tr className="border-t" key={item.id}><td className="p-4 font-bold">{item.patient?.name || 'Authorised patient'}<small className="block text-slate-500">{item.patient?.patient_code}</small></td><td className="p-4">{item.referred_to_text || 'Not specified'}</td><td className="p-4">{item.reason}</td><td className="p-4"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{item.status.replaceAll('_', ' ')}</span></td>{canManage && <td className="p-4">{nextStatus[item.status] && <button disabled={busyId === item.id} onClick={() => advance(item)} className="text-xs font-bold text-blue-700 disabled:opacity-50">{busyId === item.id ? 'Saving...' : `Mark ${nextStatus[item.status]?.replaceAll('_', ' ')}`}</button>}</td>}</tr>)}</tbody></table>}</section>
    {show && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><form onSubmit={create} className="card w-full max-w-lg p-6"><h2 className="text-xl font-black">Create digital referral</h2><p className="mt-1 text-sm text-slate-600">Select registered patient and target receiving facility.</p><label className="mt-4 block text-sm font-bold">Select patient<select required value={patientId} onChange={event => setPatientId(event.target.value)} className="input mt-1">{registeredPatients.length ? registeredPatients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_code || p.id.slice(0, 8)}) {p.village ? `— ${p.village}` : ''}</option>) : <option value="">Loading registered patients...</option>}</select></label><label className="mt-3 block text-sm font-bold">Receiving facility / hospital<input required placeholder="e.g. Rampur District Hospital" value={hospital} onChange={event => setHospital(event.target.value)} className="input mt-1" /></label><label className="mt-3 block text-sm font-bold">Reason for referral<textarea required placeholder="e.g. High blood pressure & persistent chest tightness requiring specialist evaluation" value={reason} onChange={event => setReason(event.target.value)} className="input mt-1" /></label><label className="mt-3 block text-sm font-bold">Clinical notes & vitals summary<textarea placeholder="e.g. Systolic BP 160/100, pulse 92 bpm. Patient instructed to carry prescription." value={notes} onChange={event => setNotes(event.target.value)} className="input mt-1" /></label><div className="mt-5 flex gap-3"><button className="primary-btn">Submit referral</button><button type="button" onClick={() => setShow(false)} className="secondary-btn">Cancel</button></div></form></div>}
  </DashboardShell>;
}
