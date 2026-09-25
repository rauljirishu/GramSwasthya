-- Migration: 202609190007_fix_four_tier_rls_and_patient_journey.sql
-- Enforce clean four-tier permissions and smooth end-to-end patient workflow.

-- 1. Helper function for role normalization across DB and UI aliases
CREATE OR REPLACE FUNCTION public.current_grams_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    (
      CASE (SELECT role::text FROM public.users WHERE id = auth.uid())
        WHEN 'admin' THEN 'central_authority'
        WHEN 'medical_officer' THEN 'central_authority'
        WHEN 'central' THEN 'central_authority'
        WHEN 'central_authority' THEN 'central_authority'
        WHEN 'phc_head' THEN 'phc_head'
        WHEN 'head' THEN 'phc_head'
        WHEN 'phc_worker' THEN 'phc_worker'
        WHEN 'worker' THEN 'phc_worker'
        WHEN 'asha' THEN 'phc_worker'
        WHEN 'anm' THEN 'phc_worker'
        WHEN 'doctor' THEN 'doctor'
        WHEN 'hospital' THEN 'hospital'
        ELSE (SELECT role::text FROM public.users WHERE id = auth.uid())
      END
    ),
    'patient'
  );
$$;

-- 2. Helper function to test care access boundaries per assigned facility/patient
CREATE OR REPLACE FUNCTION public.can_access_care_patient(target_patient uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_grams_role() IN ('central_authority', 'admin', 'medical_officer')
  OR EXISTS (
    SELECT 1 FROM public.patient_accounts pa
    WHERE pa.patient_id = target_patient AND pa.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.patients p
    JOIN public.users u ON u.id = auth.uid()
    WHERE p.id = target_patient
      AND (
        u.role::text IN ('phc_head','phc_worker','asha','anm','worker','head','admin','central_authority')
        OR p.registered_by = auth.uid()
        OR (u.facility_id IS NOT NULL AND p.registered_phc_id IS NOT NULL AND p.registered_phc_id = u.facility_id)
      )
  ) OR EXISTS (
    SELECT 1 FROM public.referrals r
    JOIN public.users u ON u.id = auth.uid()
    WHERE r.patient_id = target_patient
      AND (
        (u.role::text IN ('doctor', 'hospital') AND (r.referred_to_doctor_id = auth.uid() OR r.referred_to_facility_id = u.facility_id OR r.referred_to_facility_id IS NULL))
        OR (r.referred_by = auth.uid())
      )
  );
$$;

-- 3. PATIENTS TABLE POLICIES
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "level3 workers register patients" ON public.patients;
DROP POLICY IF EXISTS "strict staff register patients" ON public.patients;
DROP POLICY IF EXISTS "four tier staff register patients" ON public.patients;
DROP POLICY IF EXISTS "strict read permitted patients" ON public.patients;
DROP POLICY IF EXISTS "workflow users read permitted patients" ON public.patients;
DROP POLICY IF EXISTS "strict staff update patients" ON public.patients;
DROP POLICY IF EXISTS "workflow staff update patients" ON public.patients;

CREATE POLICY "authorised staff register patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (
    registered_by = auth.uid()
    OR public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor')
  );

CREATE POLICY "strict read permitted patients" ON public.patients FOR SELECT TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority', 'admin')
    OR public.can_access_care_patient(id)
  );

CREATE POLICY "authorised staff update patients" ON public.patients FOR UPDATE TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor')
    OR public.can_access_care_patient(id)
  )
  WITH CHECK (
    public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor')
    OR public.can_access_care_patient(id)
  );

-- 4. HEALTH RECORDS (VITALS & CLINICAL SCREENING) POLICIES
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strict read health records" ON public.health_records;
DROP POLICY IF EXISTS "strict staff create health records" ON public.health_records;
DROP POLICY IF EXISTS "strict staff update health records" ON public.health_records;
DROP POLICY IF EXISTS "workflow users read health records" ON public.health_records;
DROP POLICY IF EXISTS "workflow clinicians create health records" ON public.health_records;
DROP POLICY IF EXISTS "workflow clinicians update health records" ON public.health_records;

CREATE POLICY "strict read health records" ON public.health_records FOR SELECT TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority', 'admin')
    OR public.can_access_care_patient(patient_id)
  );

CREATE POLICY "strict staff create health records" ON public.health_records FOR INSERT TO authenticated
  WITH CHECK (
    recorded_by = auth.uid()
    AND public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor', 'hospital')
  );

CREATE POLICY "strict staff update health records" ON public.health_records FOR UPDATE TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor', 'hospital')
  )
  WITH CHECK (
    public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor', 'hospital')
  );

-- 5. REFERRALS POLICIES
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strict read referrals" ON public.referrals;
DROP POLICY IF EXISTS "strict staff create referrals" ON public.referrals;
DROP POLICY IF EXISTS "strict staff update referrals" ON public.referrals;
DROP POLICY IF EXISTS "four tier staff create referrals" ON public.referrals;
DROP POLICY IF EXISTS "workflow users read referrals" ON public.referrals;
DROP POLICY IF EXISTS "workflow clinicians create referrals" ON public.referrals;
DROP POLICY IF EXISTS "workflow participants update referrals" ON public.referrals;

CREATE POLICY "strict read referrals" ON public.referrals FOR SELECT TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority', 'admin')
    OR public.can_access_care_patient(patient_id)
    OR referred_by = auth.uid()
  );

CREATE POLICY "strict staff create referrals" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (
    referred_by = auth.uid()
    AND public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor', 'hospital')
  );

CREATE POLICY "strict staff update referrals" ON public.referrals FOR UPDATE TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor', 'hospital')
    OR referred_by = auth.uid()
    OR referred_to_doctor_id = auth.uid()
  )
  WITH CHECK (
    public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor', 'hospital')
    OR referred_by = auth.uid()
    OR referred_to_doctor_id = auth.uid()
  );

-- 6. FOLLOW-UPS POLICIES
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strict read followups" ON public.follow_ups;
DROP POLICY IF EXISTS "strict staff create followups" ON public.follow_ups;
DROP POLICY IF EXISTS "strict staff update followups" ON public.follow_ups;
DROP POLICY IF EXISTS "workflow users read followups" ON public.follow_ups;
DROP POLICY IF EXISTS "workflow staff create followups" ON public.follow_ups;
DROP POLICY IF EXISTS "workflow staff update followups" ON public.follow_ups;

CREATE POLICY "strict read followups" ON public.follow_ups FOR SELECT TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority', 'admin')
    OR public.can_access_care_patient(patient_id)
  );

CREATE POLICY "strict staff create followups" ON public.follow_ups FOR INSERT TO authenticated
  WITH CHECK (
    public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor', 'hospital')
  );

CREATE POLICY "strict staff update followups" ON public.follow_ups FOR UPDATE TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor', 'hospital')
  )
  WITH CHECK (
    public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker', 'doctor', 'hospital')
  );

-- 7. SUPPORT REQUESTS (RESOURCE DEMANDS) POLICIES
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff insert support requests" ON public.support_requests;
DROP POLICY IF EXISTS "central authority update support requests" ON public.support_requests;
DROP POLICY IF EXISTS "users create support requests" ON public.support_requests;

CREATE POLICY "staff insert support requests" ON public.support_requests FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.current_grams_role() IN ('central_authority', 'phc_head', 'phc_worker')
  );

CREATE POLICY "central authority update support requests" ON public.support_requests FOR UPDATE TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority', 'admin')
  )
  WITH CHECK (
    public.current_grams_role() IN ('central_authority', 'admin')
  );

NOTIFY pgrst, 'reload schema';
