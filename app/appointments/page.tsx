'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardShell } from '@/components/dashboard-shell';
import { BookAppointmentModal } from '@/components/book-appointment-modal';
import { getAppointments } from '@/lib/api/doctor';
import type { Appointment } from '@/lib/types';
import { 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Building2, 
  Plus, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Filter,
  ArrowRight
} from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState('');

  async function fetchAppointments() {
    setLoading(true);
    try {
      const data = await getAppointments();
      setAppointments(data || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleBookingSuccess = (newAppt: Appointment) => {
    // Add to local state immediately so it is shown in the list right away!
    setAppointments((prev) => [newAppt, ...prev.filter(a => a.id !== newAppt.id)]);
    setNotice(`Appointment successfully booked for ${newAppt.patient?.name || 'Patient'} and saved in database!`);
    setTimeout(() => setNotice(''), 4000);
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const pName = apt.patient?.name || '';
      const pid = apt.patient?.patient_code || `PID-${apt.patient_id.slice(0, 8).toUpperCase()}`;
      const docName = apt.doctor?.name || '';
      const facilityName = apt.facility?.name || '';
      const purpose = apt.purpose || '';

      const matchesQuery = 
        pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purpose.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [appointments, searchQuery, statusFilter]);

      const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-3 py-1 text-xs font-black text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">Confirmed</span>;
      case 'in_progress':
        return <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-black text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">In Progress</span>;
      case 'completed':
        return <span className="rounded-full bg-indigo-100 dark:bg-indigo-950/60 px-3 py-1 text-xs font-black text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">Completed</span>;
      case 'cancelled':
        return <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-3 py-1 text-xs font-black text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">Cancelled</span>;
      default:
        return <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-black text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Scheduled</span>;
    }
  };

  return (
    <DashboardShell>
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <span className="eyebrow flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> Clinical Scheduling System
          </span>
          <h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">Patient Appointments</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View, schedule and track verified clinical appointments with unique Patient IDs (PID)
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 transition-all duration-200"
        >
          <Plus className="h-5 w-5" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Security Info Banner */}
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 p-3.5 text-xs font-semibold text-blue-900 dark:text-blue-200">
        <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <span>All appointments are logged with unique PID, facility metadata, and stored securely in the GramCare database.</span>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 p-4 text-sm font-bold text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Patient Name, PID (e.g. GC-2026-1001), Doctor or Purpose..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-600 transition"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <section className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading appointments from database...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200">No Appointments Found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {searchQuery || statusFilter !== 'all'
                ? 'No appointments match your search filter criteria.'
                : 'Click "Book Appointment" above to create your first clinical appointment.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" /> Book Appointment Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Patient & Unique PID</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Purpose / Reason</th>
                  <th className="px-6 py-4">Assigned Doctor & Facility</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAppointments.map((apt) => {
                  const patientName = apt.patient?.name || 'Registered Patient';
                  const pid = apt.patient?.patient_code || `PID-${apt.patient_id.slice(0, 8).toUpperCase()}`;
                  const doctorName = apt.doctor?.name || 'General Duty Officer';
                  const facilityName = apt.facility?.name || 'GramCare PHC';
                  const dateStr = new Date(apt.appointment_date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const timeStr = new Date(apt.appointment_date).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      {/* Patient & PID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black text-xs">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <Link 
                              href={apt.patient?.patient_code ? `/patients/${apt.patient.patient_code}` : `/patients`} 
                              className="font-extrabold text-slate-900 dark:text-white hover:text-blue-600 transition"
                            >
                              {patientName}
                            </Link>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                PID: {pid}
                              </span>
                              {apt.patient?.village && (
                                <span className="text-xs text-slate-500">· {apt.patient.village}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                          <Calendar className="h-3.5 w-3.5 text-blue-600" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span>{timeStr}</span>
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">{apt.purpose}</p>
                        {apt.clinical_notes && (
                          <p className="mt-0.5 text-[11px] text-slate-500 truncate max-w-xs">{apt.clinical_notes}</p>
                        )}
                      </td>

                      {/* Doctor & Facility */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />
                          <span>{doctorName}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <Building2 className="h-3.5 w-3.5 text-blue-600" />
                          <span>{facilityName}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(apt.status)}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={apt.patient?.patient_code ? `/patients/${apt.patient.patient_code}` : `/patients`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Record <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleBookingSuccess}
      />
    </DashboardShell>
  );
}
