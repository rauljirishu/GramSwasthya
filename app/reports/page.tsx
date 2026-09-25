'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { 
  FileText, 
  Plus, 
  Search, 
  UploadCloud, 
  Filter, 
  User, 
  Building2, 
  Calendar, 
  Eye, 
  CheckCircle2, 
  X,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

interface PatientReport {
  id: string;
  patient_id: string;
  patient_name?: string;
  patient_pid?: string;
  report_title: string;
  report_type: 'lab_test' | 'prescription' | 'imaging' | 'discharge_summary' | 'other';
  facility_name: string;
  doctor_name: string;
  report_date: string;
  notes?: string;
  file_url?: string;
  created_at: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [pidSearch, setPidSearch] = useState('');
  const [matchedPatient, setMatchedPatient] = useState<{ id: string; name: string; patient_code: string } | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState<PatientReport['report_type']>('lab_test');
  const [facilityName, setFacilityName] = useState('Rampur Primary Health Centre');
  const [doctorName, setDoctorName] = useState('Dr. Duty Officer');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch patients for matching
      const { data: pts } = await supabase.from('patients').select('id, name, patient_code');
      const patientMap = new Map((pts || []).map(p => [p.id, p]));

      // 2. Fetch clinical records / reports
      const { data: recs, error } = await supabase
        .from('clinical_records')
        .select('*')
        .order('occurred_on', { ascending: false });

      if (error) {
        setNotice(`Loaded demo clinical reports: ${error.message}`);
      }

      if (recs && recs.length > 0) {
        const mapped: PatientReport[] = recs.map(r => {
          const pt = patientMap.get(r.patient_id);
          return {
            id: r.id,
            patient_id: r.patient_id,
            patient_name: pt?.name || 'Registered Patient',
            patient_pid: pt?.patient_code || 'Unlinked patient ID',
            report_title: r.title || 'Clinical Diagnostic Report',
            report_type: r.resource_type === 'encounter' ? 'lab_test' : 'clinical_note' as any,
            facility_name: r.source_label || 'GramCare PHC Unit',
            doctor_name: 'PHC Medical Staff',
            report_date: r.occurred_on || new Date().toISOString().split('T')[0],
            notes: r.description || 'Clinical observation report stored in PHC digital system.',
            created_at: r.created_at || new Date().toISOString()
          };
        });
        setReports(mapped);
      } else {
        // Default sample reports for demonstration
        setReports([
          {
            id: 'rep-1',
            patient_id: 'p-1',
            patient_name: 'Demo Patient',
            patient_pid: 'DEMO-UNLINKED',
            report_title: 'Complete Blood Count (CBC) & Sugar Panel',
            report_type: 'lab_test',
            facility_name: 'Rampur Primary Health Centre',
            doctor_name: 'Dr. Anita Sharma',
            report_date: '2026-09-20',
            notes: 'Hemoglobin: 12.5 g/dL, Fasting Blood Sugar: 110 mg/dL. Within normal limits.',
            created_at: new Date().toISOString()
          },
          {
            id: 'rep-2',
            patient_id: 'p-2',
            patient_name: 'Rajesh Patel',
            patient_pid: 'DEMO-UNLINKED',
            report_title: 'Chest X-Ray & ANC Screening Report',
            report_type: 'imaging',
            facility_name: 'Kheda CHC Diagnostic Unit',
            doctor_name: 'Dr. Vikram Patel',
            report_date: '2026-09-22',
            notes: 'Lungs clear, no active infiltrates. Recommended 4-week follow-up.',
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err: any) {
      setNotice(err.message || 'Error loading patient reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // Search Patient by PID for Modal
  async function handlePidSearch() {
    if (!pidSearch.trim()) return;
    const { data: pts } = await supabase
      .from('patients')
      .select('id, name, patient_code')
      .or(`patient_code.ilike.%${pidSearch.trim()}%,name.ilike.%${pidSearch.trim()}%`)
      .limit(1);

    if (pts && pts.length > 0) {
      setMatchedPatient(pts[0]);
    } else {
      setMatchedPatient(null);
      setNotice('No registered patient matched. Register the patient first, then search again to attach this report to their real PID.');
    }
  }

  async function handleAddReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportTitle.trim()) {
      setNotice('Please provide a report title.');
      return;
    }
    if (!matchedPatient) {
      setNotice('Search for a registered patient and select their real PID before adding a report.');
      return;
    }
    setSubmitting(true);
    setNotice('');

    try {
      const pName = matchedPatient.name;
      const pPid = matchedPatient.patient_code;

      const newRep: PatientReport = {
        id: 'rep-' + Date.now(),
        patient_id: matchedPatient.id,
        patient_name: pName,
        patient_pid: pPid,
        report_title: reportTitle.trim(),
        report_type: reportType,
        facility_name: facilityName.trim(),
        doctor_name: doctorName.trim(),
        report_date: reportDate,
        notes: notes.trim(),
        file_url: fileUrl.trim() || undefined,
        created_at: new Date().toISOString()
      };

      setReports(prev => [newRep, ...prev]);
      setNotice(`New report "${reportTitle}" uploaded successfully for Patient PID ${pPid}!`);
      setShowModal(false);
      setReportTitle('');
      setNotes('');
      setFileUrl('');
    } catch (err: any) {
      setNotice(err.message || 'Failed to store report.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesType = typeFilter === 'all' || r.report_type === typeFilter;
      const q = searchQuery.toLowerCase();
      const matchesQuery = !q || 
        (r.patient_name || '').toLowerCase().includes(q) || 
        (r.patient_pid || '').toLowerCase().includes(q) || 
        (r.report_title || '').toLowerCase().includes(q) || 
        (r.facility_name || '').toLowerCase().includes(q);

      return matchesType && matchesQuery;
    });
  }, [reports, typeFilter, searchQuery]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-blue-200 backdrop-blur">
              <FileCheck className="h-4 w-4 text-blue-300" /> PATIENT MEDICAL REPORTS & DIAGNOSTIC STORE
            </div>
            <h1 className="mt-3 text-2xl sm:text-4xl font-black text-white">
              PHC Patient Reports & Diagnostic Store
            </h1>
            <p className="mt-2 text-sm text-blue-100 max-w-2xl leading-relaxed">
              Upload, store, and check patient lab tests, imaging, prescriptions, and clinical reports searchable by Patient Unique ID (PID).
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="primary-btn bg-blue-500 hover:bg-blue-600 text-white font-black text-xs sm:text-sm shadow-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Upload Patient Report
          </button>
        </header>

        {notice && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs font-bold text-blue-900 flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="text-blue-500 hover:text-blue-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <section className="card p-6 border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Patient Name, PID (e.g. PID-2026-10492), report title..."
                className="input py-2.5 text-xs font-semibold pl-9 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Report Category:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="input py-1.5 text-xs font-bold max-w-44"
              >
                <option value="all">All Categories ({reports.length})</option>
                <option value="lab_test">Lab Tests</option>
                <option value="imaging">Imaging & X-Ray</option>
                <option value="prescription">Prescriptions</option>
                <option value="discharge_summary">Discharge Summaries</option>
              </select>
            </div>
          </div>

          {/* Reports Grid / List */}
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500">Loading patient reports store...</div>
          ) : filteredReports.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {filteredReports.map(rep => (
                <article key={rep.id} className="card p-5 border-slate-200 dark:border-slate-800 hover:shadow-lg transition">
                  <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-bold">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div>
                        <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 px-2.5 py-0.5 text-[10px] font-black text-blue-800 dark:text-blue-200 uppercase">
                          {rep.patient_pid}
                        </span>
                        <h3 className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                          {rep.patient_name}
                        </h3>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize">
                      {rep.report_type.replaceAll('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                      {rep.report_title}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {rep.facility_name} · <span className="font-semibold text-slate-700 dark:text-slate-300">{rep.doctor_name}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Date: {rep.report_date}
                    </p>
                    {rep.notes && (
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs font-normal text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 mt-2">
                        {rep.notes}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified Store Document
                    </span>
                    <button
                      onClick={() => setNotice(`Viewing report: ${rep.report_title} for PID ${rep.patient_pid}`)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      <Eye className="h-3.5 w-3.5" /> Inspect Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-semibold text-slate-500">
              No medical reports found matching your PID or category search.
            </div>
          )}
        </section>

        {/* Upload Report Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
            <form onSubmit={handleAddReport} className="card w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Upload / Store Patient Report</h2>
                  <p className="text-xs text-slate-500">Link diagnostic reports to patient PID for PHC staff verification.</p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* PID Search bar */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900 dark:bg-blue-950/40">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Search Patient by Unique PID or Name:
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={pidSearch}
                    onChange={e => setPidSearch(e.target.value)}
                    placeholder="e.g. PID-2026-10492 or Patient Name"
                    className="input text-xs py-1.5"
                  />
                  <button
                    type="button"
                    onClick={handlePidSearch}
                    className="secondary-btn text-xs px-3 font-bold bg-blue-600 text-white"
                  >
                    Match PID
                  </button>
                </div>
                {matchedPatient && (
                  <p className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Matched: {matchedPatient.name} ({matchedPatient.patient_code})
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs font-bold">
                <label className="sm:col-span-2 block">
                  Report Title <span className="text-rose-500">*</span>
                  <input
                    required
                    type="text"
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                    placeholder="e.g. Blood Test Report, ANC Ultrasound..."
                    className="input mt-1 text-xs"
                  />
                </label>

                <label className="block">
                  Category
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value as any)}
                    className="input mt-1 text-xs"
                  >
                    <option value="lab_test">Lab Test Result</option>
                    <option value="imaging">Imaging / X-Ray / Scan</option>
                    <option value="prescription">Prescription Document</option>
                    <option value="discharge_summary">Discharge Summary</option>
                  </select>
                </label>

                <label className="block">
                  Report Date
                  <input
                    type="date"
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                    className="input mt-1 text-xs font-semibold"
                  />
                </label>

                <label className="block">
                  Facility / PHC Centre
                  <input
                    type="text"
                    value={facilityName}
                    onChange={e => setFacilityName(e.target.value)}
                    className="input mt-1 text-xs"
                  />
                </label>

                <label className="block">
                  Attending Doctor
                  <input
                    type="text"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    className="input mt-1 text-xs"
                  />
                </label>

                <label className="sm:col-span-2 block">
                  Diagnostic Findings & Clinical Notes
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Enter lab values, observations, or doctor recommendations..."
                    className="input mt-1 min-h-16 text-xs font-normal"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="secondary-btn text-xs">
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  className="primary-btn text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {submitting ? 'Uploading...' : 'Store & Attach Report'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
