export type SupportedLanguage = 'en' | 'hi' | 'gu' | 'mr';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
    gu: string;
    mr: string;
  };
}

export const translations: TranslationDictionary = {
  // Brand & Shell
  appName: { en: 'GramCare', hi: 'ग्रामकेयर', gu: 'ગ્રામકેર', mr: 'ग्रामकेअर' },
  appTagline: { en: 'Connected Healthcare for Rural Communities', hi: 'ग्रामीण समुदायों के लिए कनेक्टेड स्वास्थ्य सेवा', gu: 'ગ્રામીણ સમુદાયો માટે કનેક્ટેડ હેલ્થકેર', mr: 'ग्रामीण समुदायांसाठी कनेक्टेड आरोग्य सेवा' },
  centralAuthority: { en: 'Central Authority', hi: 'केंद्रीय प्राधिकरण', gu: 'સેન્ટ્રલ ઓથોરિટી', mr: 'केंद्रीय प्राधिकरण' },
  phcHead: { en: 'PHC Head', hi: 'पीएचसी प्रमुख', gu: 'પીએચસી વડા', mr: 'पीएचसी प्रमुख' },
  phcWorker: { en: 'PHC Worker / ASHA', hi: 'पीएचसी कार्यकर्ता / आशा', gu: 'પીએચસી કાર્યકર / આશા', mr: 'पीएचसी कार्यकर्ता / आशा' },
  patientUser: { en: 'Patient', hi: 'मरीज़', gu: 'દર્દી', mr: 'रुग्ण' },

  // Navigation Items
  navDashboard: { en: 'Dashboard', hi: 'डैशबोर्ड', gu: 'ડેશબોર્ડ', mr: 'डॅशबोर्ड' },
  navAppointments: { en: 'Appointments', hi: 'अपॉइंटमेंट', gu: 'એપોઇન્ટમેન્ટ્સ', mr: 'अपॉइंटमेंट्स' },
  navPatients: { en: 'Patients Directory', hi: 'मरीज़ सूची', gu: 'દર્દીઓની યાદી', mr: 'रुग्ण डिरेक्टरी' },
  navReferrals: { en: 'Inter-Facility Referrals', hi: 'इंटर-फैसिलिटी रेफरल', gu: 'ઇન્ટર-ફેસિલીટી રેફરલ', mr: 'इंटर-फॅसिलिटी रेफरल्स' },
  navFollowUps: { en: 'Follow-ups', hi: 'फॉलो-अप', gu: 'ફોલો-અપ્સ', mr: 'फॉलो-अप्स' },
  navMaternalCare: { en: 'Maternal Care', hi: 'मातृ देखभाल', gu: 'માતૃ સંભાળ', mr: 'माता काळजी' },
  navHealthEducation: { en: 'Health Guidance', hi: 'स्वास्थ्य मार्गदर्शन', gu: 'આરોગ્ય માર્ગદર્શન', mr: 'आरोग्य मार्गदर्शन' },
  navMap: { en: 'Nearby Care Map', hi: 'निकटतम स्वास्थ्य केंद्र नक्शा', gu: 'નજીકના આરોગ્ય કેન્દ્રો', mr: 'जवळपासची आरोग्य केंद्रे' },
  navWorkers: { en: 'Worker Management', hi: 'कार्यकर्ता प्रबंधन', gu: 'કાર્યકર સંચાલન', mr: 'कार्यकर्ते व्यवस्थापन' },
  navNotifications: { en: 'Reminders & Notifications', hi: 'रिमाइंडर और सूचनाएं', gu: 'રિમાઇન્ડર્સ અને સૂચનાઓ', mr: 'रिमाइंडर्स आणि सूचना' },
  navSignOut: { en: 'Sign Out', hi: 'लॉग आउट', gu: 'સાઇન આઉટ', mr: 'साइन आउट' },

  // Dashboard Headings & Metric Labels
  dashboardTitle: { en: 'Connected care for every village.', hi: 'हर गाँव के लिए कनेक्टेड देखभाल।', gu: 'દરેક ગામ માટે કનેક્ટેડ સંભાળ.', mr: 'प्रत्येक गावासाठी जोडलेली काळजी.' },
  dashboardDesc: { en: 'GramCare supports secure healthcare continuity from field registration through clinical review, appointment booking, referral, treatment and follow-up.', hi: 'ग्रामकेयर क्षेत्र पंजीकरण से लेकर नैदानिक समीक्षा, अपॉइंटमेंट बुकिंग, रेफरल, उपचार और फॉलो-अप तक सुरक्षित स्वास्थ्य सेवा की निरंतरता का समर्थन करता है।', gu: 'ગ્રામકેર ક્ષેત્ર સંગ્રહથી લઇ ક્લિનિકલ સમીક્ષા, એપોઇન્ટમેન્ટ બુકિંગ, રેફરલ, ઉપચાર અને ફોલો-અપ સુધી સુરક્ષિત આરોગ્યસંભાળની નિરંતરતાને સપોર્ટ કરે છે.', mr: 'ग्रामकेअर क्षेत्र नोंदणीपासून क्लिनिकल पुनरावलोकन, अपॉइंटमेंट बुकिंग, संदर्भ, उपचार आणि फॉलो-अप पर्यंत सुरक्षित आरोग्य सेवा सलगतेला पाठिंबा देते.' },
  bookAppointmentBtn: { en: 'Book Appointment', hi: 'अपॉइंटमेंट बुक करें', gu: 'એપોઇન્ટમેન્ટ બુક કરો', mr: 'अपॉइंटमेंट बुक करा' },
  bookAppointmentNoLogin: { en: 'Book Appointment (No Login)', hi: 'अपॉइंटमेंट बुक करें (बिना लॉगिन)', gu: 'એપોઇન્ટમેન્ટ બુક કરો (વગર લોગિન)', mr: 'अपॉइंटमेंट बुक करा (लॉगिनशिवाय)' },
  createAccountBtn: { en: 'Create Account', hi: 'खाता बनाएं', gu: 'ખાતું બનાવો', mr: 'खाते तयार करा' },
  signInBtn: { en: 'Sign In', hi: 'साइन इन करें', gu: 'સાઇન ઇન', mr: 'साइन इन करा' },

  // AI Risk Triage Levels
  riskLow: { en: 'Low Risk 🟢', hi: 'कम जोखिम 🟢 (Low)', gu: 'ઓછું જોખમ 🟢 (Low)', mr: 'कमी धोका 🟢 (Low)' },
  riskMedium: { en: 'Medium Risk 🟡', hi: 'मध्यम जोखिम 🟡 (Medium)', gu: 'મધ્યમ જોખમ 🟡 (Medium)', mr: 'मध्यम धोका 🟡 (Medium)' },
  riskHigh: { en: 'High Risk 🔴', hi: 'उच्च जोखिम 🔴 (High)', gu: 'ઉચ્ચ જોખમ 🔴 (High)', mr: 'उच्च धोका 🔴 (High)' },
  riskCritical: { en: 'Critical Escalation 🔴', hi: 'अत्यंत गंभीर 🔴 (Critical)', gu: 'અત્યંત ગંભીર 🔴 (Critical)', mr: 'अत्यंत गंभीर 🔴 (Critical)' },

  // Metric Card Titles
  totalPHCs: { en: 'Total PHCs', hi: 'कुल पीएचसी', gu: 'કુલ પીએચસી', mr: 'एकूण पीएचसी' },
  healthcareWorkers: { en: 'Healthcare Workers', hi: 'स्वास्थ्य कार्यकर्ता', gu: 'આરોગ્ય કાર્યકરો', mr: 'आरोग्य कार्यकर्ते' },
  hospitalsCount: { en: 'Hospitals', hi: 'अस्पताल', gu: 'હોસ્પિટલો', mr: 'रुग्णालये' },
  registeredPatients: { en: 'Registered Patients (PID)', hi: 'पंजीकृत मरीज़ (PID)', gu: 'નોંધાયેલા દર્દીઓ (PID)', mr: 'नोंदणीकृत रुग्ण (PID)' },
  activeReferrals: { en: 'Active Referrals', hi: 'सक्रिय रेफरल', gu: 'સક્રિય રેફરલ્સ', mr: 'सक्रिय संदर्भ' },
  followUpsDue: { en: 'Follow-ups Due', hi: 'देय फॉलो-अप', gu: 'બાકી ફોલો-અપ્સ', mr: 'बाकी फॉलो-अप्स' },

  // Patients Directory
  patientsDirectory: { en: 'Patients Directory', hi: 'मरीज़ निर्देशिका', gu: 'દર્દીઓની ડિરેક્ટરી', mr: 'रुग्ण डिरेक्टरी' },
  patientPIDText: { en: 'Official patient records tracked by unique Patient ID (PID).', hi: 'अनूठे पेशेंट आईडी (PID) द्वारा ट्रैक किए गए आधिकारिक मरीज़ रिकॉर्ड।', gu: 'અનન્ય પેશન્ટ આઇડી (PID) દ્વારા ટ્રેક કરાયેલા સત્તાવાર દર્દી રેકોર્ડ્સ.', mr: 'युनिक पेशंट आयडी (PID) द्वारे मागोवा घेतलेली अधिकृत रुग्ण नोंदणी.' },
  registerNewPatient: { en: 'Register New Patient', hi: 'नया मरीज़ पंजीकृत करें', gu: 'નવા દર્દીની નોંધણી કરો', mr: 'नवीन रुग्णाची नोंदणी करा' },
  resetDemoData: { en: 'Reset Demo Data', hi: 'डेमो डेटा रीसेट करें', gu: 'ડેમો ડેટા રીસેટ કરો', mr: 'डेमो डेटा रीसेट करा' },
  searchPatientPlaceholder: { en: 'Search Name, PID (e.g. GC-2026-1001) or Village...', hi: 'नाम, PID (जैसे GC-2026-1001) या गाँव खोजें...', gu: 'નામ, PID (જેમ કે GC-2026-1001) અથવા ગામ શોધો...', mr: 'नाव, PID (उदा. GC-2026-1001) किंवा गाव शोधा...' },

  // Patient Profile & Reports
  patientProfile: { en: 'Patient Record & Reports', hi: 'मरीज़ रिकॉर्ड और रिपोर्ट', gu: 'દર્દી રેકોર્ડ અને રિપોર્ટ્સ', mr: 'रुग्ण नोंदणी व अहवाल' },
  patientReportsTab: { en: 'Patient Reports & Documents', hi: 'मरीज़ रिपोर्ट और दस्तावेज़', gu: 'દર્દી રિપોર્ટ્સ અને દસ્તાવેજો', mr: 'रुग्ण अहवाल आणि कागदपत्रे' },
  addReportBtn: { en: 'Add Medical Report', hi: 'मेडिकल रिपोर्ट जोड़ें', gu: 'મેડિકલ રિપોર્ટ ઉમેરો', mr: 'वैद्यकीय अहवाल जोडा' },
  recordVitalsBtn: { en: 'Record Vitals & Triage', hi: 'वाइटल्स और ट्रायेज दर्ज करें', gu: 'વાયટલ્સ અને ટ્રાયજ નોંધો', mr: 'व्हाइटल्स आणि ट्रायज नोंदवा' },
  readOnlyNotice: { en: 'Read-Only Patient Record — Patients cannot modify clinical entries.', hi: 'केवल पढ़ने योग्य मरीज़ रिकॉर्ड — मरीज़ नैदानिक प्रविष्टियों को संशोधित नहीं कर सकते।', gu: 'ફક્ત વાંચવા માટેનો દર્દી રેકોર્ડ — દર્દીઓ ક્લિનિકલ એન્ટ્રીઓ બદલી શકતા નથી.', mr: 'फक्त वाचण्यासाठी रुग्ण नोंद — रुग्ण क्लिनिकल नोंदी बदलू शकत नाहीत.' },

  // Referrals
  referralsTitle: { en: 'Inter-Facility Referrals', hi: 'इंटर-फैसिलिटी रेफरल', gu: 'ઇન્ટર-ફેસિલીટી રેફરલ', mr: 'इंटर-फॅसिलिटी रेफरल्स' },
  lookupByPIDTitle: { en: 'Find Patient Medical Details by PID', hi: 'PID द्वारा मरीज़ के चिकित्सा विवरण खोजें', gu: 'PID દ્વારા દર્દીની મેડિકલ વિગતો શોધો', mr: 'PID द्वारे रुग्णाची वैद्यकीय माहिती शोधा' },
  enterPIDPlaceholder: { en: 'Enter PID (e.g. GC-2026-1001)...', hi: 'PID दर्ज करें (जैसे GC-2026-1001)...', gu: 'PID દાખલ કરો (જેમ કે GC-2026-1001)...', mr: 'PID प्रविष्ट करा (उदा. GC-2026-1001)...' },
  lookupBtn: { en: 'Lookup PID', hi: 'PID खोजें', gu: 'PID શોધો', mr: 'PID शोधा' },
  createReferralBtn: { en: 'Create New Referral', hi: 'नया रेफरल बनाएं', gu: 'નવું રેફરલ બનાવો', mr: 'नवीन संदर्भ तयार करा' },

  // Reminders & Notifications
  remindersTitle: { en: 'Reminders & Notifications', hi: 'रिमाइंडर और सूचनाएं', gu: 'રિમાઇન્ડર્સ અને સૂચનાઓ', mr: 'रिमाइंडर्स आणि सूचना' },
  appointmentReminders: { en: 'Appointment Reminders', hi: 'अपॉइंटमेंट रिमाइंडर', gu: 'એપોઇન્ટમેન્ટ રિમાઇન્ડર્સ', mr: 'अपॉइंटमेंट रिमाइंडर्स' },
  emergencyAlerts: { en: 'PHC Emergency Alerts', hi: 'पीएचसी आपातकालीन अलर्ट', gu: 'પીએચસી કટોકટી ચેતવણીઓ', mr: 'पीएचसी आणीबाणी इशारे' },
  prescriptionTimings: { en: 'Prescription Dosage Timings', hi: 'दवा खुराक का समय', gu: 'દવાના ડોઝનો સમય', mr: 'औषधांच्या वेळेचे वेळापत्रक' },
  markAsTaken: { en: 'Mark as Taken', hi: 'दवा ली दर्ज करें', gu: 'લેવાઈ ગઈ નોંધો', mr: 'औषध घेतले नोंदवा' },
  setAlarm: { en: 'Set Reminder Alarm', hi: 'रिमाइंडर अलार्म सेट करें', gu: 'રિમાઇન્ડર એલાર્મ સેટ કરો', mr: 'रिमाइंडर अलार्म सेट करा' }
};
