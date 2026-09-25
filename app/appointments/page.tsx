'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { useGramCareRealtime } from '@/lib/realtime/use-gramcare-realtime';
import { NearbyPHCFinder, type PHCChoice } from '@/components/nearby-phc-finder';
import { createAppointment, updateAppointmentStatus, getDoctors } from '@/lib/api/doctor';
import type { Appointment, DoctorUser, Patient } from '@/lib/types';
import { 
  CalendarDays, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Building2, 
  UserCheck, 
  Stethoscope, 
  X,
  Filter
} from 'lucide-react';

export default function AppointmentsPage() {
  useGramCareRealtime(() => { loadData(); });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState('');

  // Modal form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPHC, setSelectedPHC] = useState<PHCChoice | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [purpose, setPurpose] = useState('General PHC Wellness Checkup');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const r = await import('@/lib/auth').then(m => m.currentRole());
      if (r) setRole(r);

      // Fetch appointments with foreign table relationships
      const { data: appts, error: apptErr } = await supabase
        .from('appointments')
        .select('*, patient:patients(*), facility:facilities(*), doctor:users(*)')
        .order('appointment_date', { ascending: true });

      if (apptErr) {
        console.error('Appointments load error:', apptErr);
        setNotice(`Unable to load appointments: ${apptErr.message}`);
      } else if (appts) {
        setAppointments(appts as unknown as Appointment[]);
      }

      // Fetch doctors for dropdown
      const docs = await getDoctors();
      setDoctors(docs);

      // Fetch patients list for modal dropdown
      const { data: pts } = await supabase.from('patients').select('*').order('name');
      if (pts) {
        setPatients(pts as Patient[]);
        if (pts.length > 0 && !selectedPatientId) {
          setSelectedPatientId(pts[0].id);
        }
      }
    } catch (err: any) {
      setNotice(err.message || 'Error loading appointment details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const matchesStatus = statusFilter === 'all' || appt.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const patientName = appt.patient?.name || '';
      const facilityName = appt.facility?.name || '';
      const doctorName = appt.doctor?.name || '';
      const purposeText = appt.purpose || '';
      const matchesSearch = !q || 
        patientName.toLowerCase().includes(q) || 
        facilityName.toLowerCase().includes(q) || 
        doctorName.toLowerCase().includes(q) || 
        purposeText.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [appointments, statusFilter, searchQuery]);

  // Appointment counts
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'scheduled').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };
  }, [appointments]);

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!['worker', 'patient'].includes(role)) { setNotice('Appointments may be booked by patients for their own account or by an assigned PHC Worker.'); return; }
    if (!selectedPHC) { setNotice('Search for a nearby PHC and select the facility before booking.'); return; }
    if (!appointmentDate) {
      setNotice('Please select an appointment date.');
      return;
    }
    if (!selectedPatientId && patients.length > 0) {
      setNotice('Please select a patient.');
      return;
    }
    setSubmitting(true);
    setNotice('');

    try {
      await createAppointment({
        patientId: selectedPatientId || 'd0000000-0000-0000-0000-000000000002',
        facilityId: selectedPHC.facilityId || undefined,
        doctorId: selectedDoctorId || undefined,
        appointmentDate,
        purpose,
        preferredFacility: { name: selectedPHC.name, address: selectedPHC.address, latitude: selectedPHC.latitude, longitude: selectedPHC.longitude, phone: selectedPHC.phone },
        clinicalNotes: `${role === 'patient' ? 'Patient self-scheduled PHC visit' : clinicalNotes.trim() || 'Scheduled via GramCare Appointments portal'}. Preferred PHC: ${selectedPHC.name}; ${selectedPHC.address}; ${selectedPHC.distanceKm.toFixed(1)} km away.${selectedPHC.phone ? ` Contact: ${selectedPHC.phone}.` : ''}`
      });

      setNotice('New PHC clinical appointment scheduled successfully!');
      setShowModal(false);
      setAppointmentDate('');
      setClinicalNotes('');
      setSelectedPHC(null);
      await loadData();
    } catch (err: any) {
      setNotice(err.message || 'Failed to schedule appointment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(id: string, newStatus: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') {
    if (!['worker', 'doctor', 'hospital'].includes(role)) return;
    setBusyId(id);
    try {
      await updateAppointmentStatus(id, newStatus);
      setNotice(`Appointment status updated to "${newStatus.replaceAll('_', ' ')}".`);
      await loadData();
    } catch (err: any) {
      setNotice(err.message || 'Failed to update appointment status.');
    } finally {
      setBusyId('');
    }
  }

  const canCreate = ['worker', 'patient'].includes(role);
  const canUpdate = ['worker', 'doctor', 'hospital'].includes(role);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header Section */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-6 text-white sm:p-8 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-purple-200 backdrop-blur">
              <CalendarDays className="h-4 w-4 text-purple-300" /> PHC CLINICAL CARE & DOCTOR APPOINTMENTS
            </div>
            <h1 className="mt-3 text-2xl sm:text-4xl font-black text-white">
              PHC Appointments Management
            </h1>
            <p className="mt-2 text-sm text-purple-100 max-w-2xl leading-relaxed">
              Schedule, track, and manage patient visits and doctor consultations across registered Primary Health Centres.
            </p>
          </div>
          {canCreate && <button 
            onClick={() => setShowModal(true)} 
            className="primary-btn bg-purple-500 hover:bg-purple-600 text-white font-black shadow-lg"
          >
            <Plus className="h-4 w-4" /> Schedule PHC Appointment
          </button>}
        </header>

        {notice && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs font-bold text-blue-900 flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="text-blue-500 hover:text-blue-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stats Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5 border-purple-100 bg-purple-50/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700">Total Appointments</p>
              <CalendarDays className="h-5 w-5 text-purple-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900">{stats.total}</p>
            <p className="text-[11px] text-slate-500 mt-1">Across all registered PHCs</p>
          </div>

          <div className="card p-5 border-amber-100 bg-amber-50/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Scheduled Visits</p>
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-amber-900">{stats.scheduled}</p>
            <p className="text-[11px] text-amber-600 mt-1">Awaiting PHC doctor visit</p>
          </div>

          <div className="card p-5 border-blue-100 bg-blue-50/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Confirmed</p>
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-blue-900">{stats.confirmed}</p>
            <p className="text-[11px] text-blue-600 mt-1">Confirmed with Medical Officer</p>
          </div>

          <div className="card p-5 border-emerald-100 bg-emerald-50/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Completed</p>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-900">{stats.completed}</p>
            <p className="text-[11px] text-emerald-600 mt-1">Successfully attended</p>
          </div>
        </div>

        {/* Filter Toolbar & Table */}
        <section className="card p-6 border-slate-200 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, PHC, doctor or purpose..."
                className="input py-2 text-xs font-semibold pl-9 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input py-1.5 text-xs font-bold max-w-44"
              >
                <option value="all">All Statuses ({stats.total})</option>
                <option value="scheduled">Scheduled ({stats.scheduled})</option>
                <option value="confirmed">Confirmed ({stats.confirmed})</option>
                <option value="completed">Completed ({stats.completed})</option>
                <option value="cancelled">Cancelled ({stats.cancelled})</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500">Loading appointments directory...</div>
          ) : filteredAppointments.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">PHC Facility</th>
                    <th className="p-4">Doctor / Officer</th>
                    <th className="p-4">Purpose</th>
                    <th className="p-4">Status</th>
                    {canUpdate && <th className="p-4">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map(appt => (
                    <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900">
                          {appt.patient?.name || 'Registered Patient'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {appt.patient?.patient_code || 'ID: ' + appt.patient_id.slice(0, 8)} {appt.patient?.village ? `· ${appt.patient.village}` : ''}
                        </div>
                      </td>

                      <td className="p-4 font-bold text-slate-800 text-xs">
                        {appt.appointment_date}
                      </td>

                      <td className="p-4 text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {appt.facility?.name || appt.preferred_facility_name || 'Facility not linked'}
                        </span>
                      </td>

                      <td className="p-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
                          {appt.doctor?.name ? `Dr. ${appt.doctor.name}` : 'Duty Medical Officer'}
                        </span>
                      </td>

                      <td className="p-4 text-xs text-slate-700 font-medium max-w-xs">
                        {appt.purpose}
                        {appt.clinical_notes && (
                          <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                            {appt.clinical_notes}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold capitalize ${
                          appt.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appt.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : appt.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {appt.status}
                        </span>
                      </td>

                      {canUpdate && <td className="p-4 text-xs space-x-2">
                        {appt.status === 'scheduled' && (
                          <button
                            disabled={busyId === appt.id}
                            onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                            className="font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                        )}

                        {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                          <button
                            disabled={busyId === appt.id}
                            onClick={() => handleUpdateStatus(appt.id, 'completed')}
                            className="font-bold text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                          >
                            Mark Completed
                          </button>
                        )}

                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                          <button
                            disabled={busyId === appt.id}
                            onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                            className="font-semibold text-rose-500 hover:text-rose-700 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-semibold text-slate-500">
              No appointments found matching your search and status filters.
            </div>
          )}
        </section>

        {/* Schedule New Appointment Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
            <form onSubmit={handleCreateAppointment} className="card w-full max-w-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Schedule New Clinical Appointment</h2>
                  <p className="text-xs text-slate-500">Register a new patient appointment at a Primary Health Centre.</p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs font-bold">
                {role !== 'patient' && <label className="sm:col-span-2 block">
                  Select Patient
                  <select
                    required
                    value={selectedPatientId}
                    onChange={e => setSelectedPatientId(e.target.value)}
                    className="input mt-1 text-xs"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.patient_code ? `(${p.patient_code})` : ''} {p.village ? `— ${p.village}` : ''}
                      </option>
                    ))}
                  </select>
                </label>}

                <div className="rounded-xl bg-blue-50 p-3 sm:col-span-2">
                  <NearbyPHCFinder onSelect={setSelectedPHC} />
                  {selectedPHC ? <p className="mt-2 text-xs text-blue-950">Selected PHC: {selectedPHC.name} · {selectedPHC.distanceKm.toFixed(1)} km · {selectedPHC.address}</p> : <p className="mt-2 text-xs text-blue-950">Use GPS or search State → District → City/Village/Pincode. Select a PHC from the sorted results.</p>}
                </div>

                <label className="block">
                  Assigned Doctor (Optional)
                  <select
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(e.target.value)}
                    className="input mt-1 text-xs"
                  >
                    <option value="">Any Duty Medical Officer</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  Preferred Appointment Date
                  <input
                    required
                    type="date"
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    className="input mt-1 text-xs font-semibold"
                  />
                </label>

                <label className="block">
                  Purpose of Visit
                  <select
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    className="input mt-1 text-xs"
                  >
                    <option value="General PHC Wellness Checkup">General PHC Wellness Checkup</option>
                    <option value="Maternal & ANC Checkup">Maternal & ANC Checkup</option>
                    <option value="Medication & Prescription Review">Medication & Prescription Review</option>
                    <option value="Child Vaccination Session">Child Vaccination Session</option>
                    <option value="Blood Pressure & Sugar Check">Blood Pressure & Sugar Check</option>
                    <option value="Specialist Consultation Follow-up">Specialist Consultation Follow-up</option>
                  </select>
                </label>

                <label className="sm:col-span-2 block">
                  Clinical Notes / Special Instructions
                  <textarea
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    placeholder="Provide details about symptoms, vitals, or specific care requests..."
                    className="input mt-1 min-h-20 text-xs font-normal"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="secondary-btn text-xs">
                  Cancel
                </button>
                <button disabled={submitting} className="primary-btn text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold">
                  {submitting ? 'Scheduling...' : 'Confirm PHC Appointment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
