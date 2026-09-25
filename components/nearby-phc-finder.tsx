'use client';

import { useRef, useState } from 'react';
import { Building2, ExternalLink, LocateFixed, MapPin, Phone, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatDistance, haversineDistanceKm, sortByDistance } from '@/lib/location/distance';
import { requestCurrentPosition, reverseGeocodeClient, searchLocationClient } from '@/lib/location/geolocation';

export type PHCChoice = {
  id: string;
  facilityId?: string;
  name: string;
  facilityType: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  phone: string;
  openingHours: string;
  availability: string;
  source: string;
};

type NearbyPHCFinderProps = {
  onSelect?: (facility: PHCChoice) => void;
  buttonLabel?: string;
  buttonClassName?: string;
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

function facilityTypeLabel(value: unknown) {
  const type = String(value || '').toLowerCase();
  if (type.includes('sub')) return 'Sub-centre / Health & Wellness Centre';
  if (type.includes('chc') || type.includes('community')) return 'Community Health Centre';
  if (type.includes('hospital')) return 'Hospital';
  if (type.includes('clinic')) return 'Clinic';
  if (type.includes('phc') || type.includes('primary')) return 'Primary Health Centre';
  return 'Health facility';
}

export function NearbyPHCFinder({ onSelect, buttonLabel = 'Ask / Find Nearby PHC', buttonClassName }: NearbyPHCFinderProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [locality, setLocality] = useState('');
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number; label: string } | null>(null);
  const [facilities, setFacilities] = useState<PHCChoice[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'info' | 'error'>('info');
  const localityRef = useRef<HTMLInputElement>(null);

  function showStatus(message: string, kind: 'info' | 'error' = 'info') {
    setStatus(message);
    setStatusKind(kind);
  }

  async function searchFacilities(center: { latitude: number; longitude: number; label: string }, region: { state?: string; district?: string } = {}) {
    setOrigin(center);
    setBusy(true);
    setFacilities([]);
    showStatus('Searching mapped and registered facilities…');
    try {
      const params = new URLSearchParams({ radiusKm: '200' });
      params.set('lat', String(center.latitude));
      params.set('lon', String(center.longitude));
      if (region.state) params.set('state', region.state);
      if (region.district) params.set('district', region.district);
      const [mapResponse, registeredResponse] = await Promise.all([
        fetch(`/api/geocode/nearby-facilities?${params.toString()}`).then(async response => ({ ok: response.ok, data: await response.json() })).catch(() => ({ ok: false, data: null })),
        supabase.from('facilities').select('*').not('latitude', 'is', null).not('longitude', 'is', null)
      ]);
      const resolvedCenter = mapResponse.ok && mapResponse.data?.userCenter
        ? { latitude: Number(mapResponse.data.userCenter.latitude), longitude: Number(mapResponse.data.userCenter.longitude), label: center.label }
        : center;
      if (Number.isFinite(resolvedCenter.latitude) && Number.isFinite(resolvedCenter.longitude)) setOrigin(resolvedCenter);
      const mapRows = mapResponse.ok && Array.isArray(mapResponse.data?.facilities) ? mapResponse.data.facilities : [];
      const rows: PHCChoice[] = [];
      for (const facility of [...mapRows, ...(registeredResponse.data || [])]) {
        const latitude = Number(facility.latitude ?? facility.lat);
        const longitude = Number(facility.longitude ?? facility.lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;
        const name = String(facility.name || '').trim();
        if (!name) continue;
        const facilitySource = String(facility.source || '');
        const facilityId = String(facility.id || '');
        const registered = Boolean(facility.facilityId || facilitySource.includes('GramCare') || facilityId.startsWith('gramcare-') || (!facilityId.startsWith('osm-') && !facilityId.startsWith('ogd-') && !facilitySource.includes('OpenStreetMap') && !facilitySource.includes('data.gov.in') && facilityId));
        const distanceKm = haversineDistanceKm(resolvedCenter.latitude, resolvedCenter.longitude, latitude, longitude);
        const item: PHCChoice = {
          id: String(facility.id || `map-${name}-${latitude}-${longitude}`),
          facilityId: facility.facilityId || (registered ? facilityId.replace(/^gramcare-/, '') : undefined),
          name,
          facilityType: facilityTypeLabel(facility.facility_type || facility.facilityType),
          address: String(facility.address || [facility.village, facility.district, facility.state].filter(Boolean).join(', ') || 'Address not listed'),
          district: String(facility.district || facility.village || ''),
          state: String(facility.state || ''),
          pincode: String(facility.pincode || facility.postcode || ''),
          latitude,
          longitude,
          distanceKm,
          phone: String(facility.phone || facility.telephone || facility.mobile_number || ''),
          openingHours: String(facility.openingHours || facility.opening_hours || ''),
          availability: String(facility.availability || facility.status || ''),
          source: registered ? 'GramCare registered' : facilitySource.includes('data.gov.in') || facilityId.startsWith('ogd-') ? 'Government of India data.gov.in' : 'Community map'
        };
        const duplicate = rows.find(existing => existing.name.toLowerCase() === item.name.toLowerCase() && haversineDistanceKm(existing.latitude, existing.longitude, latitude, longitude) < 0.25);
        if (duplicate) {
          if (item.facilityId && !duplicate.facilityId) duplicate.facilityId = item.facilityId;
          continue;
        }
        rows.push(item);
      }
      setFacilities(sortByDistance(resolvedCenter, rows));
      if (!rows.length) showStatus(mapResponse.data?.error || 'No mapped or registered facilities found. Try the full village, district and state, or a six-digit PIN code.', 'error');
      else showStatus(`Showing ${rows.length} facilities, nearest first. Map coverage varies by area.`);
    } catch {
      showStatus('Facility search failed. Check your connection or use another location.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function findByGPS() {
    setOpen(true);
    setBusy(true);
    setFacilities([]);
    showStatus('Your browser will ask whether GramCare can use your location. Coordinates are used to calculate nearby distances.');
    try {
      const position = await requestCurrentPosition(15000);
      const center = { latitude: position.latitude, longitude: position.longitude, label: 'your current location' };
      setStatus('');
      const address = await reverseGeocodeClient(position.latitude, position.longitude);
      await searchFacilities(center, address.ok ? { state: address.data.state, district: address.data.district } : {});
    } catch (error: any) {
      const denied = error?.code === 'PERMISSION_DENIED';
      showStatus(denied ? 'Location unavailable — permission was denied. Search by State → District → City/Village/Pincode below.' : 'Location unavailable. Search by State → District → City/Village/Pincode below.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function findManually() {
    const place = locality.trim() || district.trim() || state;
    if (!place) {
      showStatus('Choose a state and enter a district, city, village or six-digit PIN code.', 'error');
      localityRef.current?.focus();
      return;
    }
    const query = [place, district.trim() && place !== district.trim() ? district.trim() : '', state, 'India'].filter(Boolean).join(', ');
    setBusy(true);
    showStatus(`Finding ${query}…`);
    try {
      const geocoded = await searchLocationClient(query);
      if (!geocoded.ok || !geocoded.results.length) {
        showStatus('Location unavailable. Check the State, District, City/Village or Pincode and try again.', 'error');
        return;
      }
      const placeResult = geocoded.results[0];
      await searchFacilities({ latitude: placeResult.lat, longitude: placeResult.lon, label: placeResult.displayName }, { state: state || placeResult.address.state, district: district || placeResult.address.district });
    } finally {
      setBusy(false);
    }
  }

  function choose(facility: PHCChoice) {
    onSelect?.(facility);
    setOpen(false);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName || 'inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700'}>
        <MapPin className="h-4 w-4" />{buttonLabel}
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-3 sm:p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="nearby-phc-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-blue-700"><Building2 className="h-4 w-4" /> Nearby care search</p>
                <h2 id="nearby-phc-title" className="mt-1 text-xl font-black text-slate-900">Ask / Find Nearby PHC</h2>
                <p className="mt-1 text-xs text-slate-600">Allow GPS or search manually. We sort mapped and GramCare-registered centres by straight-line distance.</p>
              </div>
              <button type="button" aria-label="Close PHC search" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </header>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={findByGPS} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><LocateFixed className="h-4 w-4" />Where is my nearest PHC?</button>
              <button type="button" disabled={busy} onClick={findByGPS} className="rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-800 disabled:opacity-60">Find PHCs near me</button>
              <button type="button" onClick={() => localityRef.current?.focus()} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">Search PHC by village/PIN</button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-bold text-slate-800">Manual search: State → District → City/Village/Pincode</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="text-[11px] font-bold text-slate-600">State / Union Territory
                  <select value={state} onChange={event => setState(event.target.value)} className="input mt-1 py-2 text-xs"><option value="">Select state / UT</option>{INDIAN_STATES.map(item => <option key={item} value={item}>{item}</option>)}</select>
                </label>
                <label className="text-[11px] font-bold text-slate-600">District
                  <input value={district} onChange={event => setDistrict(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }} className="input mt-1 py-2 text-xs" placeholder="District name" />
                </label>
                <label className="text-[11px] font-bold text-slate-600">City, village or six-digit PIN
                  <input ref={localityRef} value={locality} onChange={event => setLocality(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }} className="input mt-1 py-2 text-xs" placeholder="Village or pincode" />
                </label>
              </div>
              <div className="mt-2 flex justify-end"><button type="button" disabled={busy} onClick={findManually} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><Search className="h-3.5 w-3.5" />{busy ? 'Searching…' : 'Search this area'}</button></div>
            </div>

            {(status || busy) && <p role={statusKind === 'error' ? 'alert' : 'status'} className={`mt-3 rounded-lg p-3 text-xs font-semibold ${statusKind === 'error' ? 'bg-amber-50 text-amber-900' : 'bg-blue-50 text-blue-900'}`}>{busy && <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent align-[-2px]" />}{status}</p>}

            {facilities.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-black text-slate-900">Nearest PHC / facility{origin?.label ? ` from ${origin.label}` : ''}</h3>
                <div className="mt-2 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                  {facilities.map((facility, index) => (
                    <article key={`${facility.id}-${index}`} className={`rounded-xl border p-3 ${index === 0 ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900">{index === 0 ? 'Nearest: ' : ''}{facility.name}</p>
                          <p className="text-[11px] font-bold text-blue-800">{facility.facilityType} · {formatDistance(facility.distanceKm)}</p>
                          <p className="mt-1 text-xs text-slate-600">{facility.address}{facility.district ? `, ${facility.district}` : ''}{facility.state ? `, ${facility.state}` : ''}{facility.pincode ? ` ${facility.pincode}` : ''}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{facility.availability === '24/7' || facility.availability === 'Open 24/7' ? 'Open 24/7' : facility.openingHours ? `Hours: ${facility.openingHours}` : facility.availability ? `Availability: ${facility.availability}` : 'Open status not listed'} · {facility.source}</p>
                          {facility.phone && <a href={`tel:${facility.phone}`} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-800"><Phone className="h-3 w-3" />{facility.phone}</a>}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1.5 text-[11px] font-bold text-slate-700"><ExternalLink className="h-3 w-3" />Directions</a>
                          {onSelect && <button type="button" onClick={() => choose(facility)} className="rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white">Select PHC</button>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-slate-500">Results combine GramCare-registered centres and mapped public listings. Government directory results are included when the server directory key is configured. No public source guarantees every operating PHC; confirm hours by phone where possible. Distances are straight-line estimates.</p>
          </section>
        </div>
      )}
    </>
  );
}
