-- Strict four-tier access for clinical data and PHC operations.
-- Existing data and tables are preserved; legacy permissive policies are replaced.

CREATE OR REPLACE FUNCTION public.current_grams_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE lower(replace(replace(coalesce((SELECT role::text FROM public.users WHERE id = auth.uid()), 'patient'), '-', '_'), ' ', '_'))
    WHEN 'admin' THEN 'central_authority'
    WHEN 'central' THEN 'central_authority'
    WHEN 'central_authority' THEN 'central_authority'
    WHEN 'medical_officer' THEN 'central_authority'
    WHEN 'head' THEN 'phc_head'
    WHEN 'phc_head' THEN 'phc_head'
    WHEN 'worker' THEN 'phc_worker'
    WHEN 'phc_worker' THEN 'phc_worker'
    WHEN 'asha' THEN 'phc_worker'
    WHEN 'anm' THEN 'phc_worker'
    ELSE lower(replace(replace(coalesce((SELECT role::text FROM public.users WHERE id = auth.uid()), 'patient'), '-', '_'), ' ', '_'))
  END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_care_patient(target_patient uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_grams_role() = 'central_authority'
    OR EXISTS (
      SELECT 1 FROM public.patient_accounts pa
      WHERE pa.patient_id = target_patient AND pa.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.patients p
      JOIN public.users u ON u.id = auth.uid()
      WHERE p.id = target_patient
        AND public.current_grams_role() IN ('phc_head', 'phc_worker')
        AND u.facility_id IS NOT NULL
        AND p.registered_phc_id = u.facility_id
    )
    OR EXISTS (
      SELECT 1 FROM public.referrals r
      WHERE r.patient_id = target_patient
        AND ((public.current_grams_role() = 'doctor' AND r.referred_to_doctor_id = auth.uid())
          OR (public.current_grams_role() = 'hospital' AND r.referred_to_facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid())))
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_care_patient(target_patient uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_grams_role() = 'phc_worker'
    AND EXISTS (
      SELECT 1 FROM public.patients p JOIN public.users u ON u.id = auth.uid()
      WHERE p.id = target_patient AND u.facility_id IS NOT NULL AND p.registered_phc_id = u.facility_id
    );
$$;

-- Staff assignment is an authority-managed boundary just like the role.
CREATE OR REPLACE FUNCTION public.prevent_role_self_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.current_grams_role() <> 'central_authority'
    AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.facility_id IS DISTINCT FROM OLD.facility_id) THEN
    RAISE EXCEPTION 'Only Central Authority can change account roles or PHC assignments';
  END IF;
  RETURN NEW;
END;
$$;

-- Remove every historic permissive rule on tables containing clinical records.
DO $$
DECLARE table_name text; policy_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','patients','patient_accounts','health_records','risk_assessments','referrals','referral_events','follow_ups','clinical_records','support_requests','appointments'] LOOP
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = table_name LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', policy_name, table_name);
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_requests DROP CONSTRAINT IF EXISTS support_requests_request_type_check;
ALTER TABLE public.support_requests ADD CONSTRAINT support_requests_request_type_check
  CHECK (request_type IN ('staffing','medicine','equipment','kit','health_camp','outbreak_support','other','complaint'));

-- Patient registry: central oversight, assigned PHC staff, or the linked patient.
CREATE POLICY four_tier_patient_read ON public.patients FOR SELECT TO authenticated
  USING (public.can_access_care_patient(id));
CREATE POLICY phc_workers_register_patients ON public.patients FOR INSERT TO authenticated
  WITH CHECK (
    public.current_grams_role() = 'phc_worker'
    AND registered_by = auth.uid()
    AND registered_phc_id = (SELECT facility_id FROM public.users WHERE id = auth.uid())
    AND registered_phc_id IS NOT NULL
  );
CREATE POLICY phc_workers_update_assigned_patients ON public.patients FOR UPDATE TO authenticated
  USING (public.can_manage_care_patient(id)) WITH CHECK (public.can_manage_care_patient(id));

-- Patient-account links are private and maintained by workers at that PHC.
CREATE POLICY patient_link_read ON public.patient_accounts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_grams_role() = 'central_authority'
    OR EXISTS (SELECT 1 FROM public.patients p JOIN public.users u ON u.id = auth.uid()
      WHERE p.id = patient_id AND public.current_grams_role() IN ('phc_head','phc_worker') AND p.registered_phc_id = u.facility_id));
CREATE POLICY phc_workers_create_patient_links ON public.patient_accounts FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_care_patient(patient_id));
CREATE POLICY phc_workers_update_patient_links ON public.patient_accounts FOR UPDATE TO authenticated
  USING (public.can_manage_care_patient(patient_id)) WITH CHECK (public.can_manage_care_patient(patient_id));
CREATE POLICY phc_workers_delete_patient_links ON public.patient_accounts FOR DELETE TO authenticated
  USING (public.can_manage_care_patient(patient_id));

-- Clinical records are read-only to Central Authority, PHC Heads and patients.
CREATE POLICY four_tier_health_records_read ON public.health_records FOR SELECT TO authenticated
  USING (public.can_access_care_patient(patient_id));
CREATE POLICY phc_workers_create_health_records ON public.health_records FOR INSERT TO authenticated
  WITH CHECK (recorded_by = auth.uid() AND public.can_manage_care_patient(patient_id));
CREATE POLICY phc_workers_update_health_records ON public.health_records FOR UPDATE TO authenticated
  USING (public.can_manage_care_patient(patient_id)) WITH CHECK (public.can_manage_care_patient(patient_id));

CREATE POLICY four_tier_risk_read ON public.risk_assessments FOR SELECT TO authenticated
  USING (public.can_access_care_patient(patient_id));
CREATE POLICY phc_workers_create_risk_assessments ON public.risk_assessments FOR INSERT TO authenticated
  WITH CHECK (public.current_grams_role() = 'phc_worker' AND public.can_manage_care_patient(patient_id));
CREATE POLICY phc_workers_update_risk_assessments ON public.risk_assessments FOR UPDATE TO authenticated
  USING (public.can_manage_care_patient(patient_id)) WITH CHECK (public.can_manage_care_patient(patient_id));

CREATE POLICY four_tier_referrals_read ON public.referrals FOR SELECT TO authenticated
  USING (public.can_access_care_patient(patient_id));
CREATE POLICY phc_workers_create_referrals ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (referred_by = auth.uid() AND public.can_manage_care_patient(patient_id));
CREATE POLICY referral_participants_update ON public.referrals FOR UPDATE TO authenticated
  USING (
    public.can_manage_care_patient(patient_id)
    OR (public.current_grams_role() = 'doctor' AND referred_to_doctor_id = auth.uid())
    OR (public.current_grams_role() = 'hospital' AND referred_to_facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid()))
  )
  WITH CHECK (
    public.can_manage_care_patient(patient_id)
    OR (public.current_grams_role() = 'doctor' AND referred_to_doctor_id = auth.uid())
    OR (public.current_grams_role() = 'hospital' AND referred_to_facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.prevent_referral_destination_clinical_edits() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.current_grams_role() IN ('doctor','hospital')
    AND (to_jsonb(NEW) - ARRAY['status','updated_at']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status','updated_at']) THEN
    RAISE EXCEPTION 'Receiving doctors and hospitals may update referral status only';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS referral_destination_status_only ON public.referrals;
CREATE TRIGGER referral_destination_status_only BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.prevent_referral_destination_clinical_edits();

CREATE POLICY four_tier_referral_events_read ON public.referral_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.referrals r WHERE r.id = referral_id AND public.can_access_care_patient(r.patient_id)));
CREATE POLICY referral_participants_create_events ON public.referral_events FOR INSERT TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND public.current_grams_role() IN ('phc_worker','doctor','hospital')
    AND EXISTS (SELECT 1 FROM public.referrals r WHERE r.id = referral_id AND public.can_access_care_patient(r.patient_id))
  );

CREATE POLICY four_tier_followups_read ON public.follow_ups FOR SELECT TO authenticated
  USING (public.can_access_care_patient(patient_id));
CREATE POLICY phc_workers_create_followups ON public.follow_ups FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_care_patient(patient_id));
CREATE POLICY phc_workers_update_followups ON public.follow_ups FOR UPDATE TO authenticated
  USING (public.can_manage_care_patient(patient_id)) WITH CHECK (public.can_manage_care_patient(patient_id));

-- Appointment rows follow the same patient boundary. Patients may book only for
-- their own linked record; PHC workers may schedule for their assigned patients.
CREATE POLICY four_tier_appointments_read ON public.appointments FOR SELECT TO authenticated
  USING (public.can_access_care_patient(patient_id));
CREATE POLICY patient_or_phc_worker_create_appointments ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    (public.can_manage_care_patient(patient_id)
      AND facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid()))
    OR (public.current_grams_role() = 'patient'
      AND public.can_access_care_patient(patient_id)
      AND status = 'scheduled'
      AND clinical_notes = 'Patient self-scheduled PHC visit')
  );
CREATE POLICY assigned_care_team_update_appointments ON public.appointments FOR UPDATE TO authenticated
  USING (
    (public.can_manage_care_patient(patient_id)
      AND facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid()))
    OR (public.current_grams_role() = 'doctor' AND doctor_id = auth.uid() AND public.can_access_care_patient(patient_id))
    OR (public.current_grams_role() = 'hospital' AND facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid()) AND public.can_access_care_patient(patient_id))
  )
  WITH CHECK (
    (public.can_manage_care_patient(patient_id)
      AND facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid()))
    OR (public.current_grams_role() = 'doctor' AND doctor_id = auth.uid() AND public.can_access_care_patient(patient_id))
    OR (public.current_grams_role() = 'hospital' AND facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid()) AND public.can_access_care_patient(patient_id))
  );
CREATE OR REPLACE FUNCTION public.prevent_appointment_destination_changes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.current_grams_role() IN ('doctor','hospital')
    AND (to_jsonb(NEW) - ARRAY['status','updated_at']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status','updated_at']) THEN
    RAISE EXCEPTION 'Receiving doctors and hospitals may update appointment status only';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS appointment_destination_status_only ON public.appointments;
CREATE TRIGGER appointment_destination_status_only BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_appointment_destination_changes();

CREATE POLICY four_tier_clinical_records_read ON public.clinical_records FOR SELECT TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority','phc_head','phc_worker','doctor','hospital')
      AND public.can_access_care_patient(patient_id)
    OR public.current_grams_role() = 'patient'
      AND status = 'verified'
      AND public.can_access_care_patient(patient_id)
  );
CREATE POLICY phc_workers_create_clinical_records ON public.clinical_records FOR INSERT TO authenticated
  WITH CHECK (practitioner_id = auth.uid() AND public.can_manage_care_patient(patient_id));
CREATE POLICY phc_workers_update_clinical_records ON public.clinical_records FOR UPDATE TO authenticated
  USING (public.can_manage_care_patient(patient_id)) WITH CHECK (public.can_manage_care_patient(patient_id));

-- PHC Heads submit requests only for their own PHC; Central Authority alone reviews them.
CREATE POLICY four_tier_requests_read ON public.support_requests FOR SELECT TO authenticated
  USING (public.current_grams_role() = 'central_authority' OR requested_by = auth.uid()
    OR (public.current_grams_role() = 'phc_head' AND facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY phc_heads_submit_resource_requests ON public.support_requests FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND public.current_grams_role() = 'phc_head'
    AND facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid())
    AND facility_id IS NOT NULL
  );
CREATE POLICY authenticated_users_submit_complaints ON public.support_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND request_type = 'complaint');
CREATE POLICY central_authority_review_requests ON public.support_requests FOR UPDATE TO authenticated
  USING (public.current_grams_role() = 'central_authority')
  WITH CHECK (public.current_grams_role() = 'central_authority');

-- Public facility discovery stays available while PHC staff remain facility-scoped.
DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'facilities' LOOP
    EXECUTE format('DROP POLICY %I ON public.facilities', policy_name);
  END LOOP;
END $$;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY four_tier_facility_directory ON public.facilities FOR SELECT TO authenticated
  USING (
    public.current_grams_role() IN ('central_authority','patient','doctor','hospital')
    OR id = (SELECT facility_id FROM public.users WHERE id = auth.uid())
  );
CREATE POLICY central_authority_manage_facilities ON public.facilities FOR ALL TO authenticated
  USING (public.current_grams_role() = 'central_authority')
  WITH CHECK (public.current_grams_role() = 'central_authority');

-- Keep staff directory visibility at the assigned PHC; Central Authority has system-wide oversight.
CREATE POLICY four_tier_users_read_profiles ON public.users FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_grams_role() = 'central_authority'
    OR (public.current_grams_role() IN ('phc_head','phc_worker') AND facility_id = (SELECT facility_id FROM public.users WHERE id = auth.uid()))
    OR (public.current_grams_role() = 'patient' AND facility_id IN (
      SELECT p.registered_phc_id FROM public.patient_accounts pa
      JOIN public.patients p ON p.id = pa.patient_id WHERE pa.user_id = auth.uid()
    )));
CREATE POLICY four_tier_users_update_profiles ON public.users FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.current_grams_role() = 'central_authority')
  WITH CHECK (id = auth.uid() OR public.current_grams_role() = 'central_authority');

NOTIFY pgrst, 'reload schema';
