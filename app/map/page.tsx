'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { LocationMap, MapMarker } from '@/components/location-map';
import { PHCDiscovery } from '@/components/phc-discovery';
import { BookAppointmentModal } from '@/components/book-appointment-modal';
import { PHCSearchResult } from '@/lib/location/india-phc-database';
import { MapPin, Building2, Calendar, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translation';

export default function NearbyCarePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedPHC, setSelectedPHC] = useState<PHCSearchResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectPHC = (phc: PHCSearchResult) => {
    setSelectedPHC(phc);
    setIsModalOpen(true);
  };

  const markers: MapMarker[] = selectedPHC ? [
    {
      lat: selectedPHC.latitude,
      lng: selectedPHC.longitude,
      label: `<b>${selectedPHC.name}</b><br/>${selectedPHC.address}<br/>${selectedPHC.open_status}`,
      color: 'blue'
    }
  ] : [
    { lat: 22.3850, lng: 73.1420, label: 'Rampur PHC (Vadodara)', color: 'blue' },
    { lat: 22.4510, lng: 73.2210, label: 'Bhadarva PHC (Savli)', color: 'blue' },
    { lat: 22.7531, lng: 72.6844, label: 'Kheda CHC', color: 'blue' },
    { lat: 18.5262, lng: 73.8741, label: 'Sassoon Hospital Pune', color: 'blue' },
    { lat: 28.5684, lng: 77.2064, label: 'Safdarjung Hospital Delhi', color: 'blue' },
    { lat: 13.1007, lng: 77.5963, label: 'Yelahanka PHC Bengaluru', color: 'blue' }
  ];

  return (
    <DashboardShell>
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <span className="eyebrow flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> Nationwide Healthcare Network
          </span>
          <h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
            {t('navMap', 'Nearby Healthcare & PHC Map')}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Find genuine Primary Health Centres, Community Hospitals, and District Facilities across all Indian States
          </p>
        </div>
      </div>

      {/* Interactive Map Display */}
      <div className="card overflow-hidden mb-7 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" /> Interactive Geographic Facility Map
          </span>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            OpenStreetMap Engine
          </span>
        </div>
        <LocationMap
          markers={markers}
          center={selectedPHC ? [selectedPHC.latitude, selectedPHC.longitude] : undefined}
          zoom={selectedPHC ? 13 : 5}
          height="340px"
        />
      </div>

      {/* Main PHC Discovery & Search Engine */}
      <PHCDiscovery onSelectPHC={handleSelectPHC} />

      {/* Book Appointment Modal with pre-selected PHC */}
      <BookAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          router.push('/appointments');
        }}
      />
    </DashboardShell>
  );
}
