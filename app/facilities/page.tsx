'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { useGramCareRealtime } from '@/lib/realtime/use-gramcare-realtime';
import { getFacilities, createFacility } from '@/lib/api/doctor';
import type { Facility } from '@/lib/types';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  HeartPulse, 
  Hospital, 
  X,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function FacilitiesPage() {
  useGramCareRealtime(() => { loadFacilities(); });
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state for creating a new PHC facility
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [facilityType, setFacilityType] = useState('Primary Health Centre');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [referralAvailable, setReferralAvailable] = useState(true);

  async function loadFacilities() {
    setLoading(true);
    try {
      const r = await import('@/lib/auth').then(m => m.currentRole());
      if (r) setRole(r);

      const facs = await getFacilities();
      setFacilities(facs);
    } catch (err: any) {
      setNotice(err.message || 'Error loading facilities directory');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFacilities(); }, []);

  const filteredFacilities = useMemo(() => {
    return facilities.filter(fac => {
      const matchesType = typeFilter === 'all' || (fac.facility_type || '').toLowerCase().includes(typeFilter.toLowerCase());
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (fac.name || '').toLowerCase().includes(q) ||
        (fac.code || '').toLowerCase().includes(q) ||
        (fac.village || '').toLowerCase().includes(q) ||
        (fac.district || '').toLowerCase().includes(q);

      return matchesType && matchesSearch;
    });
  }, [facilities, typeFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: facilities.length,
      phcs: facilities.filter(f => (f.facility_type || '').toLowerCase().includes('primary') || (f.facility_type || '').includes('PHC')).length,
      chcs: facilities.filter(f => (f.facility_type || '').toLowerCase().includes('community') || (f.facility_type || '').includes('CHC')).length,
      subCentres: facilities.filter(f => (f.facility_type || '').toLowerCase().includes('sub') || (f.facility_type || '').includes('Sub')).length,
    };
  }, [facilities]);

  async function handleRegisterFacility(e: React.FormEvent) {
    e.preventDefault();
    if (role !== 'central') { setNotice('Only Central Authority can register a PHC facility.'); return; }
    if (!name.trim()) {
      setNotice('Please provide a facility name.');
      return;
    }
    setSubmitting(true);
    setNotice('');

    try {
      await createFacility({
        name: name.trim(),
        code: code.trim() || `PHC-${Math.floor(1000 + Math.random() * 9000)}`,
        facility_type: facilityType,
        village: village.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        address: address.trim() || undefined,
        latitude: latitude.trim() ? Number(latitude) : undefined,
        longitude: longitude.trim() ? Number(longitude) : undefined,
        referral_available: referralAvailable
      });

      setNotice('New PHC Facility registered successfully in the system directory!');
      setShowModal(false);
      setName(''); setCode(''); setVillage(''); setDistrict(''); setAddress('');
      await loadFacilities();
    } catch (err: any) {
      setNotice(err.message || 'Failed to register facility.');
    } finally {
      setSubmitting(false);
    }
  }

  const canRegister = role === 'central';

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header Section */}
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 p-6 text-white sm:p-8 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-blue-200 backdrop-blur">
              <Building2 className="h-4 w-4 text-blue-300" /> REGISTERED PUBLIC HEALTHCARE INFRASTRUCTURE
            </div>
            <h1 className="mt-3 text-2xl sm:text-4xl font-black text-white">
              Area & PHC Facilities Directory
            </h1>
            <p className="mt-2 text-sm text-blue-100 max-w-2xl leading-relaxed">
              Explore primary health centres, sub-centres, community health centres, and referral hospital networks across your rural jurisdiction.
            </p>
          </div>
          {canRegister && (
            <button
              onClick={() => setShowModal(true)}
              className="primary-btn bg-blue-500 hover:bg-blue-600 text-white font-black shadow-lg"
            >
              <Plus className="h-4 w-4" /> Register New PHC Facility
            </button>
          )}
        </header>

        {notice && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs font-bold text-blue-900 flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="text-blue-500 hover:text-blue-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Breakdown Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5 border-blue-100 bg-blue-50/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Facilities</p>
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900">{stats.total}</p>
            <p className="text-[11px] text-slate-500 mt-1">Verified public health centres</p>
          </div>

          <div className="card p-5 border-indigo-100 bg-indigo-50/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Primary Health Centres</p>
              <HeartPulse className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-indigo-900">{stats.phcs}</p>
            <p className="text-[11px] text-indigo-600 mt-1">PHC Sector & Central hubs</p>
          </div>

          <div className="card p-5 border-purple-100 bg-purple-50/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700">Community Health Centres</p>
              <Hospital className="h-5 w-5 text-purple-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-purple-900">{stats.chcs}</p>
            <p className="text-[11px] text-purple-600 mt-1">First referral care units</p>
          </div>

          <div className="card p-5 border-emerald-100 bg-emerald-50/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Sub-Centres</p>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-900">{stats.subCentres}</p>
            <p className="text-[11px] text-emerald-600 mt-1">Gram panchayat outpost centres</p>
          </div>
        </div>

        {/* Toolbar & Facilities Cards */}
        <section className="card p-6 border-slate-200 shadow-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search facility name, code, village or district..."
                className="input py-2 text-xs font-semibold pl-9 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">Type Filter:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="input py-1.5 text-xs font-bold max-w-48"
              >
                <option value="all">All Types ({stats.total})</option>
                <option value="primary">PHCs ({stats.phcs})</option>
                <option value="community">CHCs ({stats.chcs})</option>
                <option value="sub">Sub-Centres ({stats.subCentres})</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500">Loading facilities registry...</div>
          ) : filteredFacilities.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFacilities.map(fac => (
                <div
                  key={fac.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 font-black">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-extrabold text-blue-900 uppercase">
                        {fac.facility_type || 'Primary Health Centre'}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-black text-slate-900">{fac.name}</h3>
                    <p className="text-xs font-bold text-blue-600">{fac.code || 'CODE: PHC-GEN'}</p>

                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <p className="flex items-center gap-1.5 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        {fac.address || `${fac.village || 'Village Sector'}, ${fac.district || 'District Area'}`}
                      </p>

                      {(fac as any).phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />{(fac as any).phone}</p>}
                      {fac.pincode && <p className="text-xs">PIN: {fac.pincode}</p>}

                      {fac.referral_available !== false && (
                        <p className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 pt-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Emergency Referral Capable
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>{fac.latitude != null && fac.longitude != null ? `Lat: ${fac.latitude.toFixed(3)} · Lon: ${fac.longitude.toFixed(3)}` : 'Coordinates not listed'}</span>
                    {fac.latitude != null && fac.longitude != null && <a
                      href={`https://www.google.com/maps/search/?api=1&query=${fac.latitude},${fac.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Map →
                    </a>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs font-semibold text-slate-500">
              No public health facilities found matching your search.
            </div>
          )}
        </section>

        {/* Register New PHC Facility Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
            <form onSubmit={handleRegisterFacility} className="card w-full max-w-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Register New PHC Facility</h2>
                  <p className="text-xs text-slate-500">Add an official primary health centre or sub-branch facility to the network.</p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs font-bold">
                <label className="sm:col-span-2 block">
                  Facility Name
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. GramCare PHC Rampur East Sub-branch"
                    className="input mt-1 text-xs font-semibold"
                  />
                </label>

                <label className="block">
                  Facility Code
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. PHC-RAMPUR-002"
                    className="input mt-1 text-xs font-semibold"
                  />
                </label>

                <label className="block">
                  Facility Type
                  <select
                    value={facilityType}
                    onChange={e => setFacilityType(e.target.value)}
                    className="input mt-1 text-xs font-semibold"
                  >
                    <option value="Primary Health Centre">Primary Health Centre (PHC)</option>
                    <option value="Sub-Centre">Sub-Centre (HWC / Health Outpost)</option>
                    <option value="Community Health Centre">Community Health Centre (CHC)</option>
                    <option value="District Hospital">District Sub-Divisional Hospital</option>
                  </select>
                </label>

                <label className="block">
                  Village / Gram Panchayat
                  <input
                    type="text"
                    value={village}
                    onChange={e => setVillage(e.target.value)}
                    placeholder="e.g. Rampur"
                    className="input mt-1 text-xs font-normal"
                  />
                </label>

                <label className="block">
                  District
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="e.g. Anand District"
                    className="input mt-1 text-xs font-normal"
                  />
                </label>

                <label className="sm:col-span-2 block">
                  Full Location Address
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Main Road, Sector 3, Near Gram Panchayat Office"
                    className="input mt-1 text-xs font-normal"
                  />
                </label>

                <label className="block">
                  GPS Latitude
                  <input
                    type="text"
                    value={latitude}
                    onChange={e => setLatitude(e.target.value)}
                    placeholder="Latitude (optional)"
                    className="input mt-1 text-xs font-normal"
                  />
                </label>

                <label className="block">
                  GPS Longitude
                  <input
                    type="text"
                    value={longitude}
                    onChange={e => setLongitude(e.target.value)}
                    placeholder="73.1812"
                    className="input mt-1 text-xs font-normal"
                  />
                </label>

                <label className="sm:col-span-2 flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={referralAvailable}
                    onChange={e => setReferralAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Facility Equipped with Emergency Referral & Ambulance Transport</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="secondary-btn text-xs">
                  Cancel
                </button>
                <button disabled={submitting} className="primary-btn text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  {submitting ? 'Registering...' : 'Save & Register Facility'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
