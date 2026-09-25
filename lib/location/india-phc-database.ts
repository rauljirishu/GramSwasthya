import { haversineDistanceKm, formatDistance } from './distance';

export interface IndiaPHCFacility {
  id: string;
  name: string;
  facility_type: 'PHC' | 'CHC' | 'Sub-District Hospital' | 'District Civil Hospital' | 'Health & Wellness Centre';
  address: string;
  village?: string;
  city_or_town?: string;
  district: string;
  state: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  open_status: string;
  referral_available: boolean;
  services_available: string[];
}

export interface PHCSearchResult extends IndiaPHCFacility {
  distanceKm?: number;
  distanceFormatted?: string;
}

export const NATIONWIDE_PHC_DATASET: IndiaPHCFacility[] = [
  // --- GUJARAT ---
  {
    id: 'phc-gj-01',
    name: 'Rampur Primary Health Centre (PHC)',
    facility_type: 'PHC',
    address: 'Main Station Road, Rampur Village, Vadodara, Gujarat - 391760',
    village: 'Rampur',
    city_or_town: 'Vadodara Rural',
    district: 'Vadodara',
    state: 'Gujarat',
    pincode: '391760',
    latitude: 22.3850,
    longitude: 73.1420,
    phone: '+91 265 2419082',
    open_status: 'Open Today · 8:00 AM - 4:00 PM',
    referral_available: true,
    services_available: ['General Outpatient', 'ANC Maternal Checkup', 'Immunization', 'Lab Testing', 'Emergency First Aid']
  },
  {
    id: 'phc-gj-02',
    name: 'Bhadarva Primary Health Centre (PHC)',
    facility_type: 'PHC',
    address: 'Near Panchayat Office, Bhadarva Village, Savli Taluka, Vadodara, Gujarat - 391770',
    village: 'Bhadarva',
    city_or_town: 'Savli',
    district: 'Vadodara',
    state: 'Gujarat',
    pincode: '391770',
    latitude: 22.4510,
    longitude: 73.2210,
    phone: '+91 265 2580194',
    open_status: 'Open Today · 8:00 AM - 4:00 PM',
    referral_available: true,
    services_available: ['Maternal ANC/PNC', 'Pediatric Care', 'Diabetes Screening', 'TB/DOTS Center']
  },
  {
    id: 'phc-gj-03',
    name: 'Kheda Community Health Centre (CHC)',
    facility_type: 'CHC',
    address: 'Hospital Road, Kheda Town, Kheda District, Gujarat - 387411',
    village: 'Kheda',
    city_or_town: 'Kheda',
    district: 'Kheda',
    state: 'Gujarat',
    pincode: '387411',
    latitude: 22.7531,
    longitude: 72.6844,
    phone: '+91 2694 220314',
    open_status: 'Open 24/7 Emergency Care',
    referral_available: true,
    services_available: ['Inpatient Ward', 'Minor Surgery', 'Maternal Delivery', 'X-Ray & Blood Bank', 'Ambulance 108']
  },
  {
    id: 'phc-gj-04',
    name: 'Dholka Sub-District Hospital',
    facility_type: 'Sub-District Hospital',
    address: 'Kalka Mata Temple Road, Dholka, Ahmedabad, Gujarat - 382225',
    city_or_town: 'Dholka',
    district: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382225',
    latitude: 22.7230,
    longitude: 72.4640,
    phone: '+91 2714 222045',
    open_status: 'Open 24/7 Emergency Care',
    referral_available: true,
    services_available: ['Emergency Medicine', 'Pediatrics', 'Obstetrics & Gynecology', 'Operation Theatre', 'ICU Unit']
  },
  {
    id: 'phc-gj-05',
    name: 'District Civil Hospital Ahmedabad',
    facility_type: 'District Civil Hospital',
    address: 'Asarwa Campus, Civil Hospital Complex, Ahmedabad, Gujarat - 380016',
    city_or_town: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380016',
    latitude: 23.0528,
    longitude: 72.6026,
    phone: '+91 79 2268 3721',
    open_status: 'Open 24/7 Tertiary Trauma Care',
    referral_available: true,
    services_available: ['Super Speciality Care', 'Trauma Center', 'CT/MRI Diagnostics', 'NICU & PICU', 'Advanced Cardiology']
  },
  {
    id: 'phc-gj-06',
    name: 'Anand Primary Health Centre',
    facility_type: 'PHC',
    address: 'Ganesh Chokdi Road, Anand, Gujarat - 388001',
    city_or_town: 'Anand',
    district: 'Anand',
    state: 'Gujarat',
    pincode: '388001',
    latitude: 22.5645,
    longitude: 72.9289,
    phone: '+91 2692 240911',
    open_status: 'Open Today · 8:00 AM - 5:00 PM',
    referral_available: true,
    services_available: ['General Outpatient', 'ANC Vaccination', 'Malaria & Dengue Screening', 'Free Medicine Dispensing']
  },

  // --- MAHARASHTRA ---
  {
    id: 'phc-mh-01',
    name: 'Shirwal Primary Health Centre (PHC)',
    facility_type: 'PHC',
    address: 'NH-48 Highway Side, Shirwal, Satara District, Maharashtra - 412801',
    village: 'Shirwal',
    city_or_town: 'Satara',
    district: 'Satara',
    state: 'Maharashtra',
    pincode: '412801',
    latitude: 18.1367,
    longitude: 73.9806,
    phone: '+91 2169 244102',
    open_status: 'Open Today · 8:00 AM - 4:00 PM',
    referral_available: true,
    services_available: ['General Medicine', 'Maternal Delivery Care', 'Child Immunization', 'Pathology Lab']
  },
  {
    id: 'phc-mh-02',
    name: 'Bhavani Peth Urban PHC Pune',
    facility_type: 'Health & Wellness Centre',
    address: 'Near Timber Market, Bhavani Peth, Pune, Maharashtra - 411042',
    city_or_town: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411042',
    latitude: 18.5089,
    longitude: 73.8672,
    phone: '+91 20 2634 1120',
    open_status: 'Open Today · 9:00 AM - 5:00 PM',
    referral_available: true,
    services_available: ['Urban Health Checkup', 'NCD Screening (BP & Sugar)', 'Free Diagnostic Testing', 'Counseling']
  },
  {
    id: 'phc-mh-03',
    name: 'Sassoon General Hospital & CHC Pune',
    facility_type: 'District Civil Hospital',
    address: 'Near Pune Railway Station, Jay Prakash Narayan Road, Pune, Maharashtra - 411001',
    city_or_town: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    latitude: 18.5262,
    longitude: 73.8741,
    phone: '+91 20 2612 8000',
    open_status: 'Open 24/7 Emergency Care',
    referral_available: true,
    services_available: ['Multi-speciality Trauma', 'Pediatric ICU', 'Dialysis Unit', 'Advanced Pathology', 'Blood Bank']
  },
  {
    id: 'phc-mh-04',
    name: 'Bhiwandi Sub-District Hospital',
    facility_type: 'Sub-District Hospital',
    address: 'Old Agra Road, Bhiwandi, Thane, Maharashtra - 421302',
    city_or_town: 'Bhiwandi',
    district: 'Thane',
    state: 'Maharashtra',
    pincode: '421302',
    latitude: 19.2969,
    longitude: 73.0631,
    phone: '+91 2522 231450',
    open_status: 'Open 24/7',
    referral_available: true,
    services_available: ['Emergency Services', 'Maternal Wards', 'Immunization Drive', 'Infectious Disease Care']
  },

  // --- DELHI / NCR ---
  {
    id: 'phc-dl-01',
    name: 'Mehrauli Primary Health Centre',
    facility_type: 'PHC',
    address: 'Near Qutub Minar Complex, Mehrauli, New Delhi - 110030',
    city_or_town: 'New Delhi',
    district: 'South Delhi',
    state: 'Delhi',
    pincode: '110030',
    latitude: 28.5244,
    longitude: 77.1855,
    phone: '+91 11 2664 2130',
    open_status: 'Open Today · 8:00 AM - 3:00 PM',
    referral_available: true,
    services_available: ['Urban Health Clinic', 'Child Vaccine', 'TB Clinic', 'Diagnostic Blood Test']
  },
  {
    id: 'phc-dl-02',
    name: 'Safdarjung Hospital & CHC Complex',
    facility_type: 'District Civil Hospital',
    address: 'Ring Road, Opposite AIIMS, New Delhi - 110029',
    city_or_town: 'New Delhi',
    district: 'New Delhi',
    state: 'Delhi',
    pincode: '110029',
    latitude: 28.5684,
    longitude: 77.2064,
    phone: '+91 11 2616 5060',
    open_status: 'Open 24/7 Emergency & Trauma',
    referral_available: true,
    services_available: ['Super Speciality Care', '24/7 Burns & Trauma', 'Pediatrics & ANC', 'Advanced Surgery']
  },
  {
    id: 'phc-dl-03',
    name: 'Noida Sector-30 District Hospital',
    facility_type: 'District Civil Hospital',
    address: 'Sector 30, Noida, Gautam Buddha Nagar, Uttar Pradesh / NCR - 201301',
    city_or_town: 'Noida',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    pincode: '201301',
    latitude: 28.5772,
    longitude: 77.3410,
    phone: '+91 120 245 0100',
    open_status: 'Open 24/7 Emergency',
    referral_available: true,
    services_available: ['General Medicine', 'Ortho Surgery', 'Maternity Ward', 'Emergency ICU']
  },

  // --- UTTAR PRADESH ---
  {
    id: 'phc-up-01',
    name: 'Bakshi Ka Talab PHC Lucknow',
    facility_type: 'PHC',
    address: 'Sitapur Road, Bakshi Ka Talab, Lucknow, Uttar Pradesh - 226201',
    village: 'BKT',
    city_or_town: 'Lucknow',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226201',
    latitude: 26.9740,
    longitude: 80.9250,
    phone: '+91 522 2841020',
    open_status: 'Open Today · 8:00 AM - 4:00 PM',
    referral_available: true,
    services_available: ['OPD Consultation', 'ANC Maternal Care', 'Polio & Routine Vaccination', 'Pathology']
  },
  {
    id: 'phc-up-02',
    name: 'Shivpur Community Health Centre Varanasi',
    facility_type: 'CHC',
    address: 'Panchkoshi Road, Shivpur, Varanasi, Uttar Pradesh - 221003',
    city_or_town: 'Varanasi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    pincode: '221003',
    latitude: 25.3610,
    longitude: 82.9730,
    phone: '+91 542 2280145',
    open_status: 'Open 24/7 Emergency',
    referral_available: true,
    services_available: ['Maternal Delivery', 'Emergency Ward', 'Immunization', 'Free Medicines', 'Lab Screening']
  },

  // --- RAJASTHAN ---
  {
    id: 'phc-rj-01',
    name: 'Sanganer Primary Health Centre Jaipur',
    facility_type: 'PHC',
    address: 'Near Bus Stand, Sanganer, Jaipur, Rajasthan - 302029',
    city_or_town: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302029',
    latitude: 26.8184,
    longitude: 75.7878,
    phone: '+91 141 2730114',
    open_status: 'Open Today · 8:00 AM - 4:00 PM',
    referral_available: true,
    services_available: ['Free Medicine Scheme (Chiranjeevi)', 'Maternal Care', 'General Medicine', 'Vaccines']
  },
  {
    id: 'phc-rj-02',
    name: 'Mandore Community Health Centre Jodhpur',
    facility_type: 'CHC',
    address: 'Main Highway Road, Mandore, Jodhpur, Rajasthan - 342007',
    city_or_town: 'Jodhpur',
    district: 'Jodhpur',
    state: 'Rajasthan',
    pincode: '342007',
    latitude: 26.3533,
    longitude: 73.0458,
    phone: '+91 291 2571020',
    open_status: 'Open 24/7',
    referral_available: true,
    services_available: ['Inpatient Ward', 'Emergency Care', 'ANC & PNC Care', 'Diagnostic Lab']
  },

  // --- KARNATAKA ---
  {
    id: 'phc-ka-01',
    name: 'Yelahanka Primary Health Centre Bengaluru',
    facility_type: 'PHC',
    address: 'Old Town Main Road, Yelahanka, Bengaluru, Karnataka - 560064',
    city_or_town: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    pincode: '560064',
    latitude: 13.1007,
    longitude: 77.5963,
    phone: '+91 80 2856 1022',
    open_status: 'Open Today · 9:00 AM - 4:30 PM',
    referral_available: true,
    services_available: ['BBMP Urban Health Care', 'Maternal Checkup', 'Child Health Clinic', 'Blood Testing']
  },
  {
    id: 'phc-ka-02',
    name: 'K.R. Hospital & CHC Mysuru',
    facility_type: 'District Civil Hospital',
    address: 'Irwin Road, Mysuru, Karnataka - 570001',
    city_or_town: 'Mysuru',
    district: 'Mysuru',
    state: 'Karnataka',
    pincode: '570001',
    latitude: 12.3118,
    longitude: 76.6503,
    phone: '+91 821 242 0800',
    open_status: 'Open 24/7 Emergency Care',
    referral_available: true,
    services_available: ['Multi-speciality Wards', 'Emergency ICU', 'Dialysis', 'Trauma Center', 'Blood Bank']
  },

  // --- TAMIL NADU ---
  {
    id: 'phc-tn-01',
    name: 'Medavakkam Primary Health Centre Chennai',
    facility_type: 'PHC',
    address: 'Velachery Main Road, Medavakkam, Chennai, Tamil Nadu - 600100',
    city_or_town: 'Chennai',
    district: 'Chengalpattu',
    state: 'Tamil Nadu',
    pincode: '600100',
    latitude: 12.9174,
    longitude: 80.1921,
    phone: '+91 44 2277 1040',
    open_status: 'Open Today · 8:00 AM - 4:00 PM',
    referral_available: true,
    services_available: ['Amma Health Checkup Scheme', 'MaternalANC', 'NCD Clinic', 'Lab Testing']
  },
  {
    id: 'phc-tn-02',
    name: 'Coimbatore District Government Hospital',
    facility_type: 'District Civil Hospital',
    address: 'Trichy Road, Coimbatore, Tamil Nadu - 641018',
    city_or_town: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641018',
    latitude: 10.9984,
    longitude: 76.9667,
    phone: '+91 422 230 1300',
    open_status: 'Open 24/7 Emergency',
    referral_available: true,
    services_available: ['Comprehensive Trauma Care', 'NICU & PICU', 'Cardiology', 'Diagnostic Imaging']
  },

  // --- WEST BENGAL ---
  {
    id: 'phc-wb-01',
    name: 'Sonarpur Rural Hospital & PHC',
    facility_type: 'PHC',
    address: 'Station Road, Rajpur Sonarpur, South 24 Parganas, West Bengal - 700150',
    city_or_town: 'Kolkata Suburbs',
    district: 'South 24 Parganas',
    state: 'West Bengal',
    pincode: '700150',
    latitude: 22.4411,
    longitude: 88.4285,
    phone: '+91 33 2434 8022',
    open_status: 'Open Today · 8:00 AM - 4:00 PM',
    referral_available: true,
    services_available: ['Swasthya Sathi Scheme', 'OPD Checkup', 'Maternal Wards', 'Pathology']
  },
  {
    id: 'phc-wb-02',
    name: 'SSKM Government Medical Hospital & CHC',
    facility_type: 'District Civil Hospital',
    address: '244 AJC Bose Road, Bhowanipore, Kolkata, West Bengal - 700020',
    city_or_town: 'Kolkata',
    district: 'Kolkata',
    state: 'West Bengal',
    pincode: '700020',
    latitude: 22.5392,
    longitude: 88.3444,
    phone: '+91 33 2223 1589',
    open_status: 'Open 24/7 Emergency Care',
    referral_available: true,
    services_available: ['Advanced Referral Care', 'Emergency ICU', 'Cardiac Care Unit', 'Nephrology']
  },

  // --- PUNJAB ---
  {
    id: 'phc-pb-01',
    name: 'Verka Primary Health Centre Amritsar',
    facility_type: 'PHC',
    address: 'Bypass Road, Verka, Amritsar, Punjab - 143501',
    city_or_town: 'Amritsar',
    district: 'Amritsar',
    state: 'Punjab',
    pincode: '143501',
    latitude: 31.6660,
    longitude: 74.9120,
    phone: '+91 183 2261020',
    open_status: 'Open Today · 8:00 AM - 3:00 PM',
    referral_available: true,
    services_available: ['Aam Aadmi Clinic', 'Free Lab Diagnostic Tests', 'Maternal Vaccines', 'OPD']
  },

  // --- KERALA ---
  {
    id: 'phc-kl-01',
    name: 'Varkala Family Health Centre (PHC)',
    facility_type: 'Health & Wellness Centre',
    address: 'Helipad Road, Varkala, Thiruvananthapuram, Kerala - 695141',
    city_or_town: 'Varkala',
    district: 'Thiruvananthapuram',
    state: 'Kerala',
    pincode: '695141',
    latitude: 8.7379,
    longitude: 76.7163,
    phone: '+91 470 2602100',
    open_status: 'Open Today · 9:00 AM - 6:00 PM',
    referral_available: true,
    services_available: ['Aardram Family Health Clinic', 'NCD Prevention', 'Palliative Care', 'E-Sanjeevani Telemedicine']
  },

  // --- BIHAR ---
  {
    id: 'phc-bh-01',
    name: 'Phulwari Sharif PHC Patna',
    facility_type: 'PHC',
    address: 'Khagaul Road, Phulwari Sharif, Patna, Bihar - 801505',
    city_or_town: 'Patna',
    district: 'Patna',
    state: 'Bihar',
    pincode: '801505',
    latitude: 25.5780,
    longitude: 85.0740,
    phone: '+91 612 2251020',
    open_status: 'Open Today · 8:00 AM - 4:00 PM',
    referral_available: true,
    services_available: ['OPD Services', 'Maternal Delivery Care', 'Immunization', 'Kala-azar Clinic']
  },

  // --- ODISHA ---
  {
    id: 'phc-or-01',
    name: 'Jatni Community Health Centre Bhubaneswar',
    facility_type: 'CHC',
    address: 'Station Bazar, Jatni, Khordha, Odisha - 752050',
    city_or_town: 'Jatni',
    district: 'Khordha',
    state: 'Odisha',
    pincode: '752050',
    latitude: 20.1583,
    longitude: 85.7067,
    phone: '+91 674 2490120',
    open_status: 'Open 24/7',
    referral_available: true,
    services_available: ['BSKY Free Healthcare', 'Maternity Ward', 'Emergency Trauma', 'Diagnostic Lab']
  },

  // --- ASSAM ---
  {
    id: 'phc-as-01',
    name: 'Sonapur District Hospital & CHC Kamrup',
    facility_type: 'CHC',
    address: 'NH-37, Sonapur, Kamrup Metropolitan, Assam - 782402',
    city_or_town: 'Sonapur',
    district: 'Kamrup Metropolitan',
    state: 'Assam',
    pincode: '782402',
    latitude: 26.1170,
    longitude: 91.9780,
    phone: '+91 361 2786010',
    open_status: 'Open 24/7',
    referral_available: true,
    services_available: ['Emergency Medicine', 'Maternal Delivery', 'Malaria & JE Clinic', 'Ambulance 108']
  }
];

export function getIndianStates(): string[] {
  const states = new Set<string>();
  NATIONWIDE_PHC_DATASET.forEach(item => {
    if (item.state) states.add(item.state);
  });
  return Array.from(states).sort();
}

export function getDistrictsForState(stateName: string): string[] {
  const districts = new Set<string>();
  NATIONWIDE_PHC_DATASET.forEach(item => {
    if (!stateName || item.state.toLowerCase() === stateName.toLowerCase()) {
      districts.add(item.district);
    }
  });
  return Array.from(districts).sort();
}

export function searchPHC(params: {
  lat?: number;
  lon?: number;
  state?: string;
  district?: string;
  query?: string;
  limit?: number;
}): PHCSearchResult[] {
  const { lat, lon, state, district, query, limit = 15 } = params;

  let filtered = [...NATIONWIDE_PHC_DATASET];

  if (state && state.trim()) {
    filtered = filtered.filter(item => item.state.toLowerCase() === state.trim().toLowerCase());
  }

  if (district && district.trim()) {
    filtered = filtered.filter(item => item.district.toLowerCase() === district.trim().toLowerCase());
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.village && item.village.toLowerCase().includes(q)) ||
      (item.city_or_town && item.city_or_town.toLowerCase().includes(q)) ||
      (item.district && item.district.toLowerCase().includes(q)) ||
      (item.pincode && item.pincode.includes(q)) ||
      (item.address && item.address.toLowerCase().includes(q))
    );
  }

  // Calculate actual distance if coordinates are provided
  if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon)) {
    const calculated = filtered.map(item => {
      const distance = haversineDistanceKm(lat, lon, item.latitude, item.longitude);
      return {
        ...item,
        distanceKm: Number(distance.toFixed(1)),
        distanceFormatted: formatDistance(distance)
      };
    });

    // Sort by actual distance ascending
    calculated.sort((a, b) => a.distanceKm - b.distanceKm);
    return calculated.slice(0, limit);
  }

  // If no GPS coordinates provided, return sorted by PHC name
  return filtered.map(item => ({ ...item, distanceKm: 0, distanceFormatted: '—' })).slice(0, limit);
}
