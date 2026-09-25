'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { currentRole } from '@/lib/auth';
import { CheckCircle2, MessageSquare, Plus, ShieldCheck, Star } from 'lucide-react';

type FeedbackItem = {
  id: string;
  sender_name: string;
  sender_role: string;
  facility_id: string | null;
  category: string;
  rating: number;
  message: string;
  created_at: string;
  status: 'new' | 'reviewed' | 'resolved';
  facilities?: { name: string } | { name: string }[] | null;
};

const categories = ['Doctor & Nursing Care', 'PHC Facility & Cleanliness', 'Medicine Availability', 'Mobile Screening Kits', 'Emergency Transport', 'Other'];

export default function FeedbackPage() {
  const [role, setRole] = useState('');
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState(categories[0]);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    const current = await currentRole();
    setRole(current || '');
    const { data, error } = await supabase.from('feedback_submissions')
      .select('id,sender_name,sender_role,facility_id,category,rating,message,status,created_at,facilities(name)')
      .order('created_at', { ascending: false });
    if (error) {
      setNotice(`Feedback could not be loaded: ${error.message}. Apply the latest Supabase migration if this table is missing.`);
      setItems([]);
    } else {
      setItems((data || []) as unknown as FeedbackItem[]);
      setNotice('');
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadFeedback(); }, [loadFeedback]);

  const averageRating = useMemo(() => items.length ? (items.reduce((total, item) => total + item.rating, 0) / items.length).toFixed(1) : '—', [items]);
  const facilityName = (item: FeedbackItem) => Array.isArray(item.facilities) ? item.facilities[0]?.name : item.facilities?.name;

  async function submitFeedback(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice('Sign in before submitting feedback.'); setBusy(false); return; }
    const { data: profile } = await supabase.from('users').select('name,role,facility_id').eq('id', user.id).single();
    const { error } = await supabase.from('feedback_submissions').insert({
      created_by: user.id,
      sender_name: senderName.trim() || profile?.name || 'GramCare user',
      sender_role: profile?.role || role || 'user',
      facility_id: profile?.facility_id || null,
      category,
      rating,
      message: message.trim()
    });
    setBusy(false);
    if (error) { setNotice(`Feedback could not be submitted: ${error.message}`); return; }
    setShowModal(false);
    setMessage('');
    setSenderName('');
    setNotice('Feedback submitted to Central Authority. Thank you.');
    await loadFeedback();
  }

  async function updateStatus(item: FeedbackItem) {
    const status = item.status === 'new' ? 'reviewed' : 'resolved';
    const { error } = await supabase.from('feedback_submissions').update({ status }).eq('id', item.id);
    if (error) { setNotice(`Feedback status could not be updated: ${error.message}`); return; }
    await loadFeedback();
  }

  return <DashboardShell>
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><span className="eyebrow">CENTRAL HEALTHCARE AUTHORITY</span><h1 className="mt-1 text-3xl font-black">Feedback & Service Evaluation</h1><p className="mt-1 text-sm text-slate-600">Feedback is saved to the database and visible to Central Authority.</p></div>
        <button onClick={() => setShowModal(true)} className="primary-btn"><Plus className="h-4 w-4" />Submit Feedback</button>
      </header>

      <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3.5 text-xs font-semibold text-blue-900"><ShieldCheck className="h-4 w-4 text-blue-700" />{role === 'central' ? 'Central Authority view: review feedback submitted across all PHCs.' : 'Your feedback is sent to Central Authority. You can view feedback submitted from your account.'}</div>
      {notice && <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-950">{notice}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-xs font-bold uppercase text-slate-500">Average Rating</p><p className="mt-2 text-3xl font-black text-slate-900">{averageRating}{items.length ? ' / 5' : ''}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase text-slate-500">Feedback Received</p><p className="mt-2 text-3xl font-black text-blue-700">{items.length}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase text-slate-500">Awaiting Review</p><p className="mt-2 text-3xl font-black text-amber-600">{items.filter(item => item.status === 'new').length}</p></div>
      </div>

      <section className="card p-6"><h2 className="mb-4 text-lg font-black">Feedback Log</h2>
        {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading saved feedback…</p> : items.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No saved feedback yet.</p> : <div className="space-y-4">{items.map(item => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><MessageSquare className="h-4 w-4" /></span><div><h3 className="font-extrabold">{item.sender_name}</h3><p className="text-xs text-slate-500">{item.sender_role.replaceAll('_', ' ')} · {facilityName(item) || 'PHC not specified'}</p></div></div><div className="flex items-center gap-1 text-amber-500">{Array.from({ length: item.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-amber-400" />)}<span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold capitalize text-slate-700">{item.status}</span></div></div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{item.message}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>Category: <b>{item.category}</b></span><span>{new Date(item.created_at).toLocaleString()}</span>{role === 'central' && item.status !== 'resolved' && <button onClick={() => void updateStatus(item)} className="inline-flex items-center gap-1 font-bold text-blue-700"><CheckCircle2 className="h-4 w-4" />{item.status === 'new' ? 'Mark reviewed' : 'Mark resolved'}</button>}</div>
        </article>)}</div>}
      </section>

      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={submitFeedback} className="card w-full max-w-lg space-y-4 p-6"><div><h2 className="text-xl font-black">Submit Service Feedback</h2><p className="mt-1 text-xs text-slate-500">Your feedback is securely recorded for Central Authority review.</p></div><label className="block text-xs font-bold">Name<input value={senderName} onChange={event => setSenderName(event.target.value)} className="input mt-1" placeholder="Name (optional)" /></label><label className="block text-xs font-bold">Category<select value={category} onChange={event => setCategory(event.target.value)} className="input mt-1">{categories.map(value => <option key={value}>{value}</option>)}</select></label><label className="block text-xs font-bold">Rating<select value={rating} onChange={event => setRating(Number(event.target.value))} className="input mt-1">{[5,4,3,2,1].map(value => <option value={value} key={value}>{value} / 5</option>)}</select></label><label className="block text-xs font-bold">Feedback<textarea required minLength={3} maxLength={4000} value={message} onChange={event => setMessage(event.target.value)} className="input mt-1 min-h-28" /></label><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="secondary-btn">Cancel</button><button disabled={busy} className="primary-btn">{busy ? 'Submitting…' : 'Submit Feedback'}</button></div></form></div>}
    </div>
  </DashboardShell>;
}
