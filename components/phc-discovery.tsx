'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  getIndianStates, 
  getDistrictsForState, 
  searchPHC, 
  PHCSearchResult 
} from '@/lib/location/india-phc-database';
import { requestCurrentPosition, reverseGeocodeClient } from '@/lib/location/geolocation';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Building2, 
  Phone, 
  Clock, 
  Compass, 
  ExternalLink, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Filter, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface PHCDiscoveryProps {
  onSelectPHC?: (phc: PHCSearchResult) => void;
  className?: string;
  compact?: boolean;
}

type LocationStatus = 'idle' | 'detecting' | 'active' | 'denied' | 'unavailable';

export function PHCDiscovery({ onSelectPHC, className = '', compact = false }: PHCDiscoveryProps) {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Manual Filter State
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showManualSearch, setShowManualSearch] = useState<boolean>(false);

  // Results
  const [results, setResults] = useState<PHCSearchResult[]>([]);

  const states = useMemo(() => getIndianStates(), []);
  const districts = useMemo(() => getDistrictsForState(selectedState), [selectedState]);

  // Perform search whenever inputs or GPS coords change
  useEffect(() => {
    let lat = userCoords?.lat;
    let lon = userCoords?.lon;

    const searched = searchPHC({
      lat,
      lon,
      state: selectedState,
      district: selectedDistrict,
      query: searchQuery,
      limit: 20
    });

    setResults(searched);
  }, [userCoords, selectedState, selectedDistrict, searchQuery]);

  // GPS Location Trigger
  const handleRequestGPS = async () => {
    setStatus('detecting');
    setErrorMsg('');
    try {
      const pos = await requestCurrentPosition();
      setUserCoords({ lat: pos.latitude, lon: pos.longitude });
      setStatus('active');

      const geocode = await reverseGeocodeClient(pos.latitude, pos.longitude);
      if (geocode.ok && geocode.data.village) {
        setLocationLabel(`${geocode.data.village}, ${geocode.data.district || ''}`);
        if (geocode.data.state && !selectedState) {
          setSelectedState(geocode.data.state);
        }
      } else {
        setLocationLabel(`GPS (${pos.latitude.toFixed(4)}° N, ${pos.longitude.toFixed(4)}° E)`);
      }
    } catch (err: any) {
      console.warn('GPS location request warning:', err);
      if (err.code === 'PERMISSION_DENIED') {
        setStatus('denied');
        setErrorMsg('Location permission was denied by browser. Please select State & District manually below.');
      } else {
        setStatus('unavailable');
        setErrorMsg('GPS location is unavailable. Please select State & District manually below.');
      }
      setShowManualSearch(true);
    }
  };

  // Quick Action Buttons (Ask / Query Shortcuts)
  const handleAskQuickQuery = (type: 'nearest' | 'near_me' | 'manual') => {
    if (type === 'nearest' || type === 'near_me') {
      handleRequestGPS();
    } else {
      setShowManualSearch(true);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Ask / Quick Query Header Options */}
      <div className="rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/80 px-3 py-1 text-xs font-black text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              <Compass className="h-3.5 w-3.5 text-blue-600 animate-spin" style={{ animationDuration: '6s' }} /> NATIONWIDE PHC DISCOVERY
            </span>
            <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              Find Genuine Nearest PHC & Healthcare Center
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Request GPS location or search nationwide across all Indian States, Districts & Pincodes
            </p>
          </div>

          <button
            onClick={handleRequestGPS}
            disabled={status === 'detecting'}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-blue-500/25 transition disabled:opacity-70 cursor-pointer"
          >
            {status === 'detecting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Detecting GPS Location...</span>
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                <span>Use Live GPS Location</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Ask Shortcuts */}
        <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-blue-100 dark:border-slate-800">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-blue-600" /> Quick Ask:
          </span>
          <button
            onClick={() => handleAskQuickQuery('nearest')}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 transition"
          >
            📍 "Where is my nearest PHC?"
          </button>
          <button
            onClick={() => handleAskQuickQuery('near_me')}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 transition"
          >
            🔍 "Find PHCs near me"
          </button>
          <button
            onClick={() => handleAskQuickQuery('manual')}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 transition"
          >
            🏘️ "Search by State / District / Village"
          </button>
        </div>

        {/* Status / Permission Alerts */}
        {status === 'active' && userCoords && (
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-blue-100/70 dark:bg-blue-950/80 p-3.5 text-xs font-bold text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>
                Live GPS Active: <strong>{locationLabel || 'Current Coordinates'}</strong> ({userCoords.lat.toFixed(4)}°, {userCoords.lon.toFixed(4)}°)
              </span>
            </div>
            <span className="rounded-md bg-blue-600 text-[10px] font-black text-white px-2 py-0.5">
              Distance Calculated
            </span>
          </div>
        )}

        {(status === 'denied' || status === 'unavailable' || errorMsg) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-50 dark:bg-amber-950/60 p-3.5 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>{errorMsg || 'GPS Location Unavailable. Please use manual State & District search below.'}</span>
            </div>
            <button
              onClick={() => setShowManualSearch(true)}
              className="underline font-black text-amber-900 dark:text-amber-200"
            >
              Open Manual Search
            </button>
          </div>
        )}
      </div>

      {/* Manual Search Form (State -> District -> Village/Pincode) */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" /> Nationwide Manual Search (State → District → Village / Pincode)
          </h3>
          {(selectedState || selectedDistrict || searchQuery) && (
            <button
              onClick={() => {
                setSelectedState('');
                setSelectedDistrict('');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Select State */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">State</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('');
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
            >
              <option value="">-- All Indian States --</option>
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Select District */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
            >
              <option value="">-- All Districts --</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Village / City / Pincode / PHC Name</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Rampur, 391760, Vadodara..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-600 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Showing {results.length} Nearby Healthcare Facilities {userCoords ? '(Sorted by Live Distance)' : ''}
          </p>
        </div>

        {results.length === 0 ? (
          <div className="card p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h4 className="text-base font-black text-slate-800 dark:text-slate-200">No PHCs Found matching criteria</h4>
            <p className="mt-1 text-xs text-slate-500">
              Try clearing filters or searching another District / State.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((phc, idx) => {
              const isNearest = idx === 0 && userCoords != null;
              const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${phc.latitude},${phc.longitude}`;

              return (
                <div
                  key={phc.id}
                  className={`card p-5 transition flex flex-col justify-between ${
                    isNearest
                      ? 'border-2 border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-md'
                      : 'hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isNearest && (
                          <span className="rounded-full bg-blue-600 text-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wider shadow">
                            ★ Genuine Nearest PHC
                          </span>
                        )}
                        <span className="rounded-md bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {phc.facility_type}
                        </span>
                      </div>

                      {phc.distanceFormatted && phc.distanceFormatted !== '—' && (
                        <span className="rounded-full bg-blue-50 dark:bg-blue-950/80 px-3 py-1 text-xs font-black text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                          {phc.distanceFormatted} away
                        </span>
                      )}
                    </div>

                    {/* Facility Name & Address */}
                    <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white leading-snug">
                      {phc.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                      <span>{phc.address}</span>
                    </p>

                    {/* Meta info: Phone, Hours, Services */}
                    <div className="mt-4 space-y-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-bold text-blue-900 dark:text-blue-200">{phc.open_status}</span>
                      </div>

                      {phc.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-blue-600" />
                          <span>{phc.phone}</span>
                        </div>
                      )}

                      {phc.services_available && phc.services_available.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 pt-1">
                          {phc.services_available.slice(0, 3).map(s => (
                            <span key={s} className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                      <span>Get Directions</span>
                    </a>

                    {onSelectPHC && (
                      <button
                        onClick={() => onSelectPHC(phc)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white shadow-md hover:bg-blue-700 transition cursor-pointer"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Select PHC</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
