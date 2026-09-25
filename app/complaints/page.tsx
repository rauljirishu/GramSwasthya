'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { currentRole } from '@/lib/auth';
import { AlertTriangle, CheckCircle2, Clock, Plus, ShieldCheck, Wrench } from 'lucide-react';

type Complaint = {
  id: string;
  requested_by: string;
  request_type: string;
  area: string | null;
  title: string;
  details: string;
  priority: 'normal' | 'high' | 'urgent';
  status: string;
  resolution_note: string | null;
  created_at: string;
  facilities?: { name: string } | { name: string }[] | null;
  users?: { name: string; role: string } | { name: string; role: string }[] | null;
};

const categories = ['Equipment & Resource Breakdown', 'Medicine Supply Delay', 'Facility Cleanliness & Water', 'Staffing / Doctor Unavailability', 'Patient Grievance / Delay', 'Other'];
const statusLabel = (status: string) => status === 'requested' ? 'Open' : status === 'under_review' || status === 'in_progress' ? 'Under Investigation' : status === 'fulfilled' ? 'Resolved' : status.replaceAll('_', ' ');
const priorityLabel = (priority: Complaint['priority']) => priority === 'urgent' ? 'Critical' : priority === 'normal' ? 'Normal' : 'High';

export default function ComplaintsPage() {
  const [role, setRole] = useState('');
  const [items, setItems] = useState<Complaint[]>([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState<Complaint['priority']>('high');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    const current = await currentRole();
    setRole(current || '');
    const { data, error } = await supabase.from('support_requests')
      .select('id,requested_by,request_type,area,title,details,priority,status,resolution_note,created_at,facilities(name),users(name,role)')
      .eq('request_type', 'complaint')
      .order('created_at', { ascending: false });
    if (error) {
      setNotice(`Complaints could not be loaded: ${error.message}. Apply the latest Supabase migration if this table is missing.`);
      setItems([]);
    } else {
      setItems((data || []) as unknown as Complaint[]);
      setNotice('');
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadComplaints(); }, [loadComplaints]);

  async function submitComplaint(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice('Sign in before submitting a complaint.'); setBusy(false); return; }
    const { data: profile, error: profileError } = await supabase.from('users').select('facility_id').eq('id', user.id).single();
    if (profileError) { setNotice(`Your account details could not be read: ${profileError.message}`); setBusy(false); return; }
    const { error } = await supabase.from('support_requests').insert({
      requested_by: user.id,
      facility_id: profile?.facility_id || null,
      request_type: 'complaint',
      area: category,
      title: title.trim(),
      details: details.trim(),
      priority,
      status: 'requested'
    });
    setBusy(false);
    if (error) { setNotice(`Complaint could not be saved: ${error.message}`); return; }
    setShowModal(false);
    setTitle('');
    setDetails('');
    setNotice('Complaint saved and submitted to Central Authority.');
    await loadComplaints();
  }

  async function updateStatus(item: Complaint, status: 'under_review' | 'fulfilled') {
    const { error } = await supabase.from('support_requests').update({
      status,
      resolved_at: status === 'fulfilled' ? new Date().toISOString() : null,
      resolution_note: status === 'fulfilled' ? 'Resolved by Central Authority.' : null
    }).eq('id', item.id);
    if (error) { setNotice(`Complaint status could not be updated: ${error.message}`); return; }
    await loadComplaints();
  }

  const openCount = items.filter(item => item.status === 'requested').length;
  const investigatingCount = items.filter(item => ['under_review', 'in_progress'].includes(item.status)).length;
  const resolvedCount = items.filter(item => item.status === 'fulfilled').length;
  const facilityOf = (value: Complaint['facilities']) => Array.isArray(value) ? value[0] : value;
const reporterOf = (value: Complaint['users']) => Array.isArray(value) ? value[0] : value;

  return <DashboardShell>
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4"><div><span className="eyebrow">CENTRAL HEALTHCARE AUTHORITY</span><h1 className="mt-1 text-3xl font-black">Complaint Box & Grievance Redressal</h1><p className="mt-1 text-sm text-slate-600">Submit and track complaints saved in the Central Authority support registry.</p></div><button onClick={() => setShowModal(true)} className="primary-btn"><Plus className="h-4 w-4" />Report Problem / Complaint</button></header>
      <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900"><AlertTriangle className="h-4 w-4 text-rose-600" />{role === 'central' ? 'Central Authority can review and resolve complaints from across PHCs.' : 'Log a problem with your PHC or care experience.'}</div>
      {notice && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-950">{notice}</div>}

      <div className="grid gap-4 sm:grid-cols-3"><div className="card border-l-4 border-l-rose-500 p-5"><p className="text-xs font-bold uppercase text-slate-500">Open Tickets</p><p className="mt-2 text-3xl font-black text-rose-600">{openCount}</p><p className="mt-1 text-xs text-slate-500">Awaiting investigation</p></div><div className="card border-l-4 border-l-amber-500 p-5"><p className="text-xs font-bold uppercase text-slate-500">Under Investigation</p><p className="mt-2 text-3xl font-black text-amber-600">{investigatingCount}</p><p className="mt-1 text-xs text-slate-500">Central action in progress</p></div><div className="card border-l-4 border-l-emerald-500 p-5"><p className="text-xs font-bold uppercase text-slate-500">Resolved Complaints</p><p className="mt-2 text-3xl font-black text-emerald-600">{resolvedCount}</p><p className="mt-1 text-xs text-slate-500">Closed by Central Authority</p></div></div>

      <section className="card p-6"><h2 className="mb-4 text-lg font-black">Grievance Ticket Registry</h2>{loading ? <p className="py-8 text-center text-sm text-slate-500">Loading saved complaints…</p> : items.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No saved complaints yet.</p> : <div className="space-y-4">{items.map(item => { const facility = facilityOf(item.facilities); const reporter = reporterOf(item.users); return <article key={item.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3"><div><span className="text-[10px] font-black uppercase text-slate-400">Ticket {item.id.slice(0, 8).toUpperCase()}</span><h3 className="text-base font-extrabold">{item.title}</h3><p className="text-xs text-slate-500">{reporter?.name || 'Authorised user'} ({reporter?.role?.replaceAll('_', ' ') || 'user'}) · {facility?.name || 'PHC not specified'}</p></div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : item.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>{priorityLabel(item.priority)} Priority</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">{statusLabel(item.status)}</span></div></div><p className="text-sm text-slate-700">{item.details}</p>{item.resolution_note && <p className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">Resolution: {item.resolution_note}</p>}<div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500"><span>Category: <b>{item.area || 'Other'}</b> · {new Date(item.created_at).toLocaleString()}</span>{role === 'central' && item.status !== 'fulfilled' && <div className="flex gap-2">{item.status === 'requested' && <button onClick={() => void updateStatus(item, 'under_review')} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 font-bold text-amber-800"><Clock className="mr-1 inline h-3.5 w-3.5" />Investigating</button>}<button onClick={() => void updateStatus(item, 'fulfilled')} className="rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Resolve</button></div>}</div></article>; })}</div>}</section>

      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={submitComplaint} className="card w-full max-w-lg space-y-4 p-6"><div className="flex items-start justify-between"><div><h2 className="text-xl font-black">Log Problem / Complaint</h2><p className="mt-1 text-xs text-slate-500">Your complaint is stored for Central Authority review.</p></div><Wrench className="h-5 w-5 text-rose-600" /></div><label className="block text-xs font-bold">Issue Category<select value={category} onChange={event => setCategory(event.target.value)} className="input mt-1">{categories.map(value => <option key={value}>{value}</option>)}</select></label><label className="block text-xs font-bold">Priority<select value={priority} onChange={event => setPriority(event.target.value as Complaint['priority'])} className="input mt-1"><option value="urgent">Critical</option><option value="high">High</option><option value="normal">Normal</option></select></label><label className="block text-xs font-bold">Complaint title<input required minLength={3} maxLength={160} value={title} onChange={event => setTitle(event.target.value)} className="input mt-1" /></label><label className="block text-xs font-bold">Description<textarea required minLength={3} maxLength={4000} value={details} onChange={event => setDetails(event.target.value)} className="input mt-1 min-h-28" /></label><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="secondary-btn">Cancel</button><button disabled={busy} className="primary-btn">{busy ? 'Saving…' : 'Submit Complaint'}</button></div></form></div>}
    </div>
  </DashboardShell>;
}
