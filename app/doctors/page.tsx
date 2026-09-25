'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { getDoctors } from '@/lib/api/doctor';
import type { DoctorUser } from '@/lib/types';
import { 
  Stethoscope, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  UserCheck, 
  CalendarDays,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadDoctors() {
    setLoading(true);
    try {
      const docs = await getDoctors();
      setDoctors(docs);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDoctors(); }, []);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const q = searchQuery.toLowerCase();
      return !q ||
        (doc.name || '').toLowerCase().includes(q) ||
        (doc.specialization || '').toLowerCase().includes(q) ||
        (doc.facility?.name || '').toLowerCase().includes(q);
    });
  }, [doctors, searchQuery]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header Section */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 p-6 text-white sm:p-8 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-emerald-200 backdrop-blur">
              <Stethoscope className="h-4 w-4 text-emerald-300" /> MEDICAL OFFICERS & PHC CLINICIANS
            </div>
            <h1 className="mt-3 text-2xl sm:text-4xl font-black text-white">
              PHC Doctors & Staff Directory
            </h1>
            <p className="mt-2 text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Find verified medical officers, specialists, and clinicians assigned across primary health centres in your district.
            </p>
          </div>
          <Link
            href="/appointments"
            className="primary-btn bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg"
          >
            <CalendarDays className="h-4 w-4" /> Book PHC Appointment
          </Link>
        </header>

        {/* Directory Search & Filter */}
        <section className="card p-6 border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by doctor name, specialization, or PHC facility..."
                className="input py-2 text-xs font-semibold pl-9 w-full"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredDoctors.length} Verified Doctors
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500">Loading doctors directory...</div>
          ) : filteredDoctors.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDoctors.map(doc => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 font-black text-lg">
                        DR
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">Dr. {doc.name}</h3>
                        <p className="text-xs font-bold text-emerald-700">
                          {doc.specialization || 'General Medical Officer'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {doc.facility?.name || 'Assigned Area PHC'}
                      </p>

                      {doc.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          {doc.phone}
                        </p>
                      )}

                      {doc.email && (
                        <p className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          {doc.email}
                        </p>
                      )}

                      <div className="pt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Active Duty
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-800">
                          <ShieldCheck className="h-3 w-3 text-blue-600" /> Verified Practitioner
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <Link
                      href="/appointments"
                      className="primary-btn w-full text-xs justify-center bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CalendarDays className="h-3.5 w-3.5" /> Schedule Appointment
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-semibold text-slate-500">
              No doctors found matching your search.
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
