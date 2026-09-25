'use client';

import { useMemo, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { LocationMap, type MapMarker } from '@/components/location-map';
import { NearbyPHCFinder, type PHCChoice } from '@/components/nearby-phc-finder';
import { requestCurrentPosition, reverseGeocodeClient, searchLocationClient, getGeolocationErrorMessage } from '@/lib/location/geolocation';
import { INDIA_MAP_CENTER } from '@/lib/location/types';
import { haversineDistanceKm, formatDistance } from '@/lib/location/distance';
import { supabase } from '@/lib/supabase/client';
import { Building2, ExternalLink, Globe, Hospital, LocateFixed, MapPin, Navigation, Phone, Search, Stethoscope } from 'lucide-react';

type Category = 'all' | 'phc' | 'chc' | 'subcentre' | 'hospital' | 'clinic';

export default function NearbyCarePage() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [facilities, setFacilities] = useState<PHCChoice[]>([]);
  const [category, setCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState('Allow GPS or search by State → District → City/Village/Pincode to find facilities.');
  const [selectedPHC, setSelectedPHC] = useState<PHCChoice | null>(null);

  async function loadNearby(latitude: number, longitude: number, label: string, region: { state?: string; district?: string } = {}) {
    setLoading(true); setMessage('Searching mapped and registered facilities…');
    setPosition([latitude, longitude]); setQuery(label); setHasSearched(true);
    try {
      const [mapResponse, registeredResponse] = await Promise.all([
        fetch(`/api/geocode/nearby-facilities?lat=${latitude}&lon=${longitude}&radiusKm=200${region.state ? `&state=${encodeURIComponent(region.state)}` : ''}${region.district ? `&district=${encodeURIComponent(region.district)}` : ''}`)
          .then(async response => ({ ok: response.ok, data: await response.json() }))
          .catch(() => ({ ok: false, data: null })),
        supabase.from('facilities').select('*').not('latitude', 'is', null).not('longitude', 'is', null)
      ]);
      const mapRows = mapResponse.ok && Array.isArray(mapResponse.data?.facilities) ? mapResponse.data.facilities : [];
      const rows: PHCChoice[] = [];
      for (const facility of [...mapRows, ...(registeredResponse.data || [])]) {
        const lat = Number(facility.latitude);
        const lon = Number(facility.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180 || !facility.name) continue;
        const source = String(facility.source || '');
        const facilityKey = String(facility.id || '');
        const isExternal = facilityKey.startsWith('osm-') || facilityKey.startsWith('ogd-') || source.includes('OpenStreetMap') || source.includes('data.gov.in');
        const item: PHCChoice = {
          id: String(facility.id),
          facilityId: isExternal ? undefined : String(facility.id).replace(/^gramcare-/, ''),
          name: String(facility.name),
          facilityType: String(facility.facility_type || 'Health facility'),
          address: String(facility.address || [facility.village, facility.district, facility.state].filter(Boolean).join(', ') || 'Address not listed'),
          district: String(facility.district || facility.village || ''),
          state: String(facility.state || ''),
          pincode: String(facility.pincode || ''),
          latitude: lat,
          longitude: lon,
          distanceKm: haversineDistanceKm(latitude, longitude, lat, lon),
          phone: String(facility.phone || ''),
          openingHours: String(facility.openingHours || ''),
          availability: String(facility.availability || facility.status || ''),
          source: isExternal ? source.includes('data.gov.in') || facilityKey.startsWith('ogd-') ? 'Government of India data.gov.in' : 'Community map' : 'GramCare registered'
        };
        const duplicate = rows.find(row => row.name.toLowerCase() === item.name.toLowerCase() && haversineDistanceKm(row.latitude, row.longitude, lat, lon) < 0.25);
        if (!duplicate) rows.push(item);
        else if (item.facilityId && !duplicate.facilityId) duplicate.facilityId = item.facilityId;
      }
      rows.sort((a, b) => a.distanceKm - b.distanceKm);
      setFacilities(rows);
      setMessage(rows.length
        ? `${rows.length} results sorted nearest first. Nearby results include mapped centres up to 200 km and all registered GramCare facilities with coordinates.`
        : 'No mapped or registered facilities found. Try a nearby district or village, or search by PIN code.');
    } catch {
      setFacilities([]);
      setMessage('Facility search is temporarily unavailable. Try again or use a different location.');
    } finally {
      setLoading(false);
    }
  }

  async function useLocation() {
    setLoading(true);
    setMessage('Your browser will ask permission to use GPS. Your location is used only to calculate distances.');
    try {
      const current = await requestCurrentPosition();
      const address = await reverseGeocodeClient(current.latitude, current.longitude);
      await loadNearby(current.latitude, current.longitude, 'your current location', address.ok ? { state: address.data.state, district: address.data.district } : {});
    } catch (error: any) {
      setFacilities([]);
      setHasSearched(true);
      setMessage(error?.code ? `Location unavailable. ${getGeolocationErrorMessage(error.code)} Search manually by State → District → City/Village/Pincode.` : 'Location unavailable. Search manually by State → District → City/Village/Pincode.');
      setLoading(false);
    }
  }

  async function searchPlace(event: React.FormEvent) {
    event.preventDefault();
    if (!search.trim()) { setMessage('Enter a village, district, city or six-digit PIN code.'); return; }
    setLoading(true); setMessage('Resolving the selected location…');
    const result = await searchLocationClient(search.trim());
    if (!result.ok || !result.results.length) {
      setMessage('Location unavailable. Try adding the district and state, or use a PIN code.');
      setLoading(false);
      setHasSearched(true);
      setFacilities([]);
      return;
    }
    const first = result.results[0];
    await loadNearby(first.lat, first.lon, first.displayName, { state: first.address.state, district: first.address.district });
  }

  const visible = useMemo(() => facilities.filter(item => {
    if (category === 'all') return true;
    const type = item.facilityType.toLowerCase();
    if (category === 'phc') return type.includes('phc') || type.includes('primary');
    if (category === 'chc') return type.includes('chc') || type.includes('community');
    if (category === 'subcentre') return type.includes('sub-centre') || type.includes('sub centre') || type.includes('wellness');
    return type.includes(category);
  }), [facilities, category]);

  const markers: MapMarker[] = [
    ...(position ? [{ lat: position[0], lng: position[1], label: 'Selected search location', color: 'red' as const }] : []),
    ...visible.map(item => ({ lat: item.latitude, lng: item.longitude, label: `<b>${item.name}</b><br>${formatDistance(item.distanceKm)} away`, color: 'blue' as const }))
  ];

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1"><p className="eyebrow">Nearby care & facilities</p><span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black text-blue-800 border border-blue-200 uppercase">GPS + India-wide search</span></div>
          <h1 className="text-3xl font-black text-slate-900">Find PHCs and nearby health facilities</h1>
          <p className="mt-1 text-sm text-slate-600">Results use mapped public facilities and all GramCare facilities with coordinates; distance is calculated from the location you choose.</p>
        </div>
        <div className="flex flex-wrap gap-2"><NearbyPHCFinder buttonLabel="Ask / Find Nearby PHC" onSelect={setSelectedPHC} /><button onClick={useLocation} disabled={loading} className="secondary-btn disabled:opacity-60"><LocateFixed className="h-4 w-4" />Use my location</button></div>
      </div>

      {selectedPHC && <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-900">Selected: {selectedPHC.name} · {formatDistance(selectedPHC.distanceKm)}</p>}
      <div className="mt-3 rounded-xl bg-slate-100 p-3 text-xs text-slate-600 border border-slate-200 flex items-center gap-2"><Globe className="h-4 w-4 text-blue-600 flex-shrink-0" /><span>Community map coverage varies by area. Missing open/availability and contact details are shown as unavailable, never guessed.</span></div>

      <form onSubmit={searchPlace} className="card mt-4 flex flex-col gap-2 p-4 sm:flex-row">
        <label className="sr-only" htmlFor="care-search">Search city, village or PIN code</label>
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input id="care-search" value={search} onChange={event => setSearch(event.target.value)} className="input py-2 pl-10" placeholder="Search State, District, City/Village or Pincode" /></div>
        <button className="secondary-btn" disabled={loading}><Search className="h-4 w-4" />{loading ? 'Searching…' : 'Find nearby care'}</button>
      </form>
      <p role="status" className="mt-3 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">{message}</p>
      {query && <p className="mt-2 text-xs font-semibold text-slate-500">Search origin: {query}</p>}

      <div className="mt-4 flex flex-wrap gap-2">{(['all', 'phc', 'chc', 'subcentre', 'hospital', 'clinic'] as Category[]).map(item => <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase transition-all ${category === item ? 'bg-blue-600 text-white shadow' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{item === 'all' ? 'All facilities' : item === 'subcentre' ? 'Sub-centres / HWCs' : item === 'phc' ? 'PHCs' : item === 'chc' ? 'CHCs' : `${item}s`}</button>)}</div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card overflow-hidden p-2"><LocationMap markers={markers} center={position || INDIA_MAP_CENTER} zoom={position ? 12 : 5} height="560px" /></div>
        <section className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
          {loading && <div className="card p-6 text-center text-sm font-bold text-slate-500">Searching nearby facilities…</div>}
          {!loading && hasSearched && !visible.length && <div className="card p-6 text-center text-sm font-bold text-slate-500">No matching facilities found. Search by a nearby town or PIN code.</div>}
          {!loading && !hasSearched && <div className="card p-6 text-center text-sm font-bold text-slate-500">Choose GPS or search a location to see nearest facilities.</div>}
          {visible.map((item, index) => <article className={`card p-4 transition-all ${index === 0 ? 'border-emerald-300' : 'hover:border-blue-300'}`} key={item.id}>
            <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">{item.facilityType.toLowerCase().includes('phc') || item.facilityType.toLowerCase().includes('centre') ? <Building2 className="h-5 w-5" /> : item.facilityType.toLowerCase().includes('clinic') ? <Stethoscope className="h-5 w-5" /> : <Hospital className="h-5 w-5" />}</span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-1"><h2 className="text-sm font-extrabold text-slate-900">{index === 0 ? 'Nearest facility: ' : ''}{item.name}</h2><span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-black text-blue-700">{formatDistance(item.distanceKm)}</span></div>
                <p className="mt-1 text-xs text-slate-600">{item.address}{item.district ? `, ${item.district}` : ''}{item.state ? `, ${item.state}` : ''}{item.pincode ? ` ${item.pincode}` : ''}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-extrabold"><span className="rounded-full bg-slate-100 px-2 py-0.5 uppercase text-slate-700">{item.facilityType}</span><span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">{item.source}</span><span className="rounded-full bg-slate-50 px-2 py-0.5 text-slate-600">{item.availability === '24/7' ? 'Open 24/7' : item.openingHours ? `Hours: ${item.openingHours}` : item.availability ? item.availability : 'Open status not listed'}</span></div>
                {item.phone && <a href={`tel:${item.phone}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-800"><Phone className="h-3 w-3" />{item.phone}</a>}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><a className="secondary-btn px-3 py-1.5 text-xs font-bold" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`}><Navigation className="h-3.5 w-3.5" />Directions</a><button type="button" onClick={() => setSelectedPHC(item)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">{selectedPHC?.id === item.id ? 'Selected PHC' : 'Select PHC'}</button></div>
              </div></div>
          </article>)}
        </section>
      </div>
    </DashboardShell>
  );
}
