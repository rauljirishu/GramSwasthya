# GramCare — Connected Healthcare for Rural Communities

GramCare is an offline-first, AI-assisted rural healthcare decision-support and digital referral platform. It helps health workers, PHCs, doctors, and hospitals coordinate care across rural healthcare settings.

---

## 🌟 Key Features

1. **Comprehensive Patient Intake & Management**:
   - Village & Gram Panchayat level patient registration.
   - Complete medical profile (Blood Group, Allergies, Pre-existing Conditions, Medications, Emergency Contact).
   - Real-time database persistence on Supabase PostgreSQL.

2. **AI-Assisted Risk Prioritization (CDSS)**:
   - Rule & model-based clinical decision support scoring (0–100 scale).
   - Dynamic triage categories: Low, Medium, High, and Critical.
   - Medical disclaimer: Decision support recommendation to assist qualified clinicians.

3. **Digital Inter-Facility Referral Workflow**:
   - Instant PHC → CHC → District Hospital referral generation.
   - Referral stage tracking (Intake → Created → Accepted → In Transit → Arrived → Completed).
   - Automated post-referral follow-up scheduling for ASHA workers.

4. **Lightweight Offline-First Outbox Sync**:
   - Local caching and offline patient/vitals registration when mobile data is unavailable.
   - Automatic background outbox queue synchronization upon internet reconnection.
   - Real-time online/offline status bar indicator.

5. **Multi-Role Access Control**:
   - **ASHA / ANM**: Intake, vitals recording, daily field workspace, follow-up checklist.
   - **Doctor**: Triage dashboard, clinical risk review, referral management, clinical notes.
   - **Hospital / Admin**: Emergency referral queue, bed/treatment status update, audit log monitoring.

---

## 🚀 Quick Start Guide

### 1. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DATA_GOV_IN_API_KEY=<optional server-only data.gov.in API key for the national facility directory>
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It enables Patient Account ID sign-in: patients enter the `PID-...` account ID issued at signup and their account password, without entering an email at login. The clinical record PID is separate from the account ID. Run all Supabase migrations in filename order, including `202609260004_repair_missing_user_profiles.sql`, before using patient-ID sign-in. Missing profiles are repaired with patient access; staff access still requires Central Authority approval.

The PHC finder combines GramCare facilities with coordinates and OpenStreetMap results for the selected area. If `DATA_GOV_IN_API_KEY` is configured, it also searches the Government of India National Hospital Directory by state and district. That directory reports facility coordinates and contact fields where available; it is updated periodically and does not guarantee live operating status. Without the key, manual location search and nearby public-map results remain available.

### 2. Database Migrations & Seed Data
Execute the following SQL scripts in order in your **Supabase Dashboard → SQL Editor**:
1. `supabase/migrations/202609090006_complete_schema_and_schema_cache_reload.sql` — Builds all 12 platform tables, indexes, RLS security policies, auth trigger, and PostgREST schema cache reload.
2. `supabase/migrations/202609090007_seed_realistic_demo_data.sql` — Populates 18 realistic rural demo patients, health vitals, AI risk scores, referrals, and follow-ups.

### 3. Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡 System Architecture & Tech Stack
- **Frontend Framework**: Next.js 14 (App Router), React 18, TypeScript.
- **Styling**: Tailwind CSS, Lucide Icons, Glassmorphism design system.
- **Backend & Database**: Supabase Auth & PostgreSQL with Row Level Security (RLS).
- **Offline Storage**: Custom outbox queue sync engine (`lib/offline/sync-engine.ts`).
