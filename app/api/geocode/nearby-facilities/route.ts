import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface PublicFacilityItem {
  id: string;
  name: string;
  facility_type: 'hospital' | 'clinic' | 'pharmacy' | 'phc' | 'chc' | 'subcentre';
  address: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  source: 'OpenStreetMap Public Data' | 'GramCare Registered PHC' | 'Government of India data.gov.in';
  referral_available: boolean;
  phone: string | null;
  openingHours: string | null;
  availability: string | null;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isCoordinate(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function facilityType(tags: Record<string, string>, name: string): PublicFacilityItem['facility_type'] | null {
  const description = `${name} ${tags.healthcare || ''} ${tags.amenity || ''}`.toLowerCase();
  if (/sub.?cent(re|er)|health post|health sub.?cent|aam.?sc/.test(description)) return 'subcentre';
  if (/community health|community health cent|\bchc\b/.test(description)) return 'chc';
  if (/primary health|\bphc\b|primary care|ayushman arogya|\baam\b|health and wellness cent/.test(description)) return 'phc';
  if (tags.amenity === 'hospital' || tags.healthcare === 'hospital') return 'hospital';
  if (tags.amenity === 'clinic' || tags.healthcare === 'clinic' || tags.healthcare === 'doctor') return 'clinic';
  return null;
}

async function resolveSearchLocation(query: string, signal: AbortSignal) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('country', 'India');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  const response = await fetch(url, {
    signal,
    headers: { 'User-Agent': 'GramCarePHC-facility-search/1.0 (public facility discovery)' },
    next: { revalidate: 86400 }
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (!Array.isArray(data) || !data[0]) return null;
  const latitude = Number(data[0].lat);
  const longitude = Number(data[0].lon);
  if (!isCoordinate(latitude, -90, 90) || !isCoordinate(longitude, -180, 180)) return null;
  return { latitude, longitude };
}

async function governmentDirectory(state: string, district: string, latitude: number, longitude: number, signal: AbortSignal): Promise<PublicFacilityItem[]> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey || !state) return [];
  const resourceId = '98fa254e-c5f8-4910-a19b-4828939b477d';
  const output: PublicFacilityItem[] = [];
  for (let offset = 0; offset < 10000; offset += 1000) {
    const url = new URL(`https://api.data.gov.in/resource/${resourceId}`);
    url.searchParams.set('api-key', apiKey);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1000');
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('filters[state]', state);
    if (district) url.searchParams.set('filters[district]', district);
    const response = await fetch(url, { signal, next: { revalidate: 86400 } });
    if (!response.ok) break;
    const data = await response.json();
    const records = Array.isArray(data?.records) ? data.records : [];
    for (const record of records) {
      const coordinates = String(record.location_coordinates || '').split(',').map((part: string) => Number(part.trim()));
      const [recordLat, recordLon] = coordinates;
      if (!isCoordinate(recordLat, -90, 90) || !isCoordinate(recordLon, -180, 180)) continue;
      const name = String(record.hospital_name || '').trim();
      if (!name) continue;
      const descriptor = `${record.hospital_care_type || ''} ${record.hospital_category || ''} ${name}`.toLowerCase();
      const type = /sub.?cent(re|er)|health post|aam.?sc/.test(descriptor) ? 'subcentre'
        : /community health|\bchc\b/.test(descriptor) ? 'chc'
        : /primary health|\bphc\b|primary care|ayushman arogya|\baam\b/.test(descriptor) ? 'phc'
        : /clinic|dispensary/.test(descriptor) ? 'clinic' : 'hospital';
      output.push({
        id: `ogd-${record.sr_no || `${recordLat}-${recordLon}-${name}`}`,
        name,
        facility_type: type,
        address: [record.address_original_first_line, record.location, record.village, record.town].filter((item: string) => item && item !== '0').join(', ') || null,
        village: record.village && record.village !== '0' ? record.village : record.town && record.town !== '0' ? record.town : null,
        district: record.district && record.district !== '0' ? record.district : null,
        state: record.state && record.state !== '0' ? record.state : null,
        latitude: recordLat,
        longitude: recordLon,
        distanceKm: haversineDistance(latitude, longitude, recordLat, recordLon),
        source: 'Government of India data.gov.in',
        referral_available: true,
        phone: [record.telephone, record.mobile_number, record.emergency_num].find((item: string) => item && item !== '0') || null,
        openingHours: null,
        availability: null
      });
    }
    if (records.length < 1000) break;
  }
  return output;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locationQuery = (searchParams.get('q') || '').trim().slice(0, 120);
  const state = (searchParams.get('state') || '').trim().slice(0, 80);
  const district = (searchParams.get('district') || '').trim().slice(0, 80);
  let latitude = searchParams.has('lat') ? Number(searchParams.get('lat')) : Number.NaN;
  let longitude = searchParams.has('lon') ? Number(searchParams.get('lon')) : Number.NaN;
  const radiusRequested = Number(searchParams.get('radiusKm') || '35');
  const radiusKm = Math.min(Math.max(Number.isFinite(radiusRequested) ? radiusRequested : 35, 2), 200);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    if (locationQuery) {
      const location = await resolveSearchLocation(locationQuery, controller.signal);
      if (!location) {
        return NextResponse.json({ error: 'Could not find that place in India. Try a village, district, or state name.' }, { status: 404 });
      }
      latitude = location.latitude;
      longitude = location.longitude;
    }
    if (!isCoordinate(latitude, -90, 90) || !isCoordinate(longitude, -180, 180)) {
      return NextResponse.json({ error: 'Provide a valid location or search for a village, district, or state.' }, { status: 400 });
    }

    const radiusMeters = Math.round(radiusKm * 1000);
    const overpassQuery = `
      [out:json][timeout:20];
      (
        nwr["name"~"(PHC|Primary Health|Sub.?Cent(re|er)|Health Post|Community Health|Ayushman Arogya|Health and Wellness Cent|AAM.?SC)",i](around:${radiusMeters},${latitude},${longitude});
        nwr["healthcare"~"^(primary|health_post|community_health_centre)$",i](around:${radiusMeters},${latitude},${longitude});
        nwr["amenity"~"^(hospital|clinic)$"](around:${radiusMeters},${latitude},${longitude});
        nwr["healthcare"~"^(hospital|clinic|doctor)$",i](around:${radiusMeters},${latitude},${longitude});
      );
      out center tags;
    `;
    let elements: any[] = [];
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: controller.signal,
        next: { revalidate: 3600 }
      });
      if (response.ok) {
        const data = await response.json();
        elements = Array.isArray(data?.elements) ? data.elements : [];
      }
    } catch {
      // Return any registered facilities even if the public map service is unavailable.
    }

    const results = new Map<string, PublicFacilityItem>();
    for (const element of elements) {
      const tags = element.tags || {};
      const name = tags.name || tags['name:en'];
      const latitudeValue = Number(element.lat ?? element.center?.lat);
      const longitudeValue = Number(element.lon ?? element.center?.lon);
      if (!name || !isCoordinate(latitudeValue, -90, 90) || !isCoordinate(longitudeValue, -180, 180)) continue;
      const type = facilityType(tags, name);
      if (!type) continue;
      const id = `osm-${element.type}-${element.id}`;
      results.set(id, {
        id,
        name,
        facility_type: type,
        address: [tags['addr:street'], tags['addr:place'], tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ') || null,
        village: tags['addr:village'] || tags['addr:suburb'] || tags['addr:town'] || null,
        district: tags['addr:district'] || tags['addr:county'] || null,
        state: tags['addr:state'] || tags['addr:province'] || null,
        latitude: latitudeValue,
        longitude: longitudeValue,
        distanceKm: haversineDistance(latitude, longitude, latitudeValue, longitudeValue),
        source: 'OpenStreetMap Public Data',
        referral_available: type !== 'pharmacy',
        phone: tags.phone || tags['contact:phone'] || null,
        openingHours: tags.opening_hours || null,
        availability: tags.opening_hours === '24/7' ? '24/7' : null
      });
    }

    if (state && process.env.DATA_GOV_IN_API_KEY) {
      try {
        const officialFacilities = await governmentDirectory(state, district, latitude, longitude, controller.signal);
        for (const facility of officialFacilities) {
          const duplicate = Array.from(results.values()).find(item => item.name.toLowerCase() === facility.name.toLowerCase() && haversineDistance(item.latitude, item.longitude, facility.latitude, facility.longitude) < 0.25);
          if (!duplicate) results.set(facility.id, facility);
          else if (!duplicate.phone && facility.phone) duplicate.phone = facility.phone;
        }
      } catch {
        // Keep community mapped results available if the OGD service is unavailable.
      }
    }

    const facilities = Array.from(results.values()).sort((a, b) => a.distanceKm - b.distanceKm);
    return NextResponse.json({
      source: facilities.some(item => item.source === 'Government of India data.gov.in') ? 'Government of India data.gov.in + OpenStreetMap' : 'OpenStreetMap mapped health centres',
      sourceUrl: 'https://www.openstreetmap.org/',
      badge: facilities.some(item => item.source === 'Government of India data.gov.in') ? 'GOVERNMENT DIRECTORY + COMMUNITY MAP' : 'COMMUNITY-MAPPED FACILITY DATA',
      disclaimer: 'Results combine available government directory records, community map listings and registered GramCare facilities. Coverage and operating status vary by area; confirm a facility is operating before travelling.',
      userCenter: { latitude, longitude },
      radiusKm,
      total: facilities.length,
      facilities
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800' } });
  } catch {
    return NextResponse.json({ error: 'Facility search is temporarily unavailable. Please try again.' }, { status: 503 });
  } finally {
    clearTimeout(timer);
  }
}
