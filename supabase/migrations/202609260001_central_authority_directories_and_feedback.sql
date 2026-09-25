-- Restore system-wide Central Authority directory access and persist feedback
-- and complaints. Patient records remain read-only for Central Authority.
BEGIN;

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

CREATE OR REPLACE FUNCTION public.current_user_facility_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT facility_id FROM public.users WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS central_authority_patient_registry_read ON public.patients;
CREATE POLICY central_authority_patient_registry_read ON public.patients
  FOR SELECT TO authenticated USING (public.current_grams_role() = 'central_authority');

DROP POLICY IF EXISTS central_authority_facility_directory_read ON public.facilities;
CREATE POLICY central_authority_facility_directory_read ON public.facilities
  FOR SELECT TO authenticated USING (public.current_grams_role() = 'central_authority');
DROP POLICY IF EXISTS central_authority_facility_directory_manage ON public.facilities;
CREATE POLICY central_authority_facility_directory_manage ON public.facilities
  FOR ALL TO authenticated
  USING (public.current_grams_role() = 'central_authority')
  WITH CHECK (public.current_grams_role() = 'central_authority');

DROP POLICY IF EXISTS central_authority_staff_directory_read ON public.users;
CREATE POLICY central_authority_staff_directory_read ON public.users
  FOR SELECT TO authenticated USING (public.current_grams_role() = 'central_authority');

-- Complaint tickets use the existing support workflow, with facility optional
-- for patients or staff who do not have an assigned PHC.
ALTER TABLE public.support_requests ALTER COLUMN facility_id DROP NOT NULL;
ALTER TABLE public.support_requests DROP CONSTRAINT IF EXISTS support_requests_request_type_check;
ALTER TABLE public.support_requests ADD CONSTRAINT support_requests_request_type_check
  CHECK (request_type IN ('staffing','medicine','equipment','kit','health_camp','outbreak_support','other','complaint'));

CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  sender_name text NOT NULL CHECK (char_length(trim(sender_name)) BETWEEN 1 AND 120),
  sender_role text NOT NULL,
  facility_id uuid REFERENCES public.facilities(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (char_length(trim(category)) BETWEEN 2 AND 120),
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message text NOT NULL CHECK (char_length(trim(message)) BETWEEN 3 AND 4000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feedback_submissions_created_at_idx
  ON public.feedback_submissions(created_at DESC);
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.feedback_submissions TO authenticated;

DROP POLICY IF EXISTS feedback_submitter_or_central_read ON public.feedback_submissions;
CREATE POLICY feedback_submitter_or_central_read ON public.feedback_submissions
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.current_grams_role() = 'central_authority');
DROP POLICY IF EXISTS authenticated_users_submit_feedback ON public.feedback_submissions;
CREATE POLICY authenticated_users_submit_feedback ON public.feedback_submissions
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS central_authority_update_feedback ON public.feedback_submissions;
CREATE POLICY central_authority_update_feedback ON public.feedback_submissions
  FOR UPDATE TO authenticated
  USING (public.current_grams_role() = 'central_authority')
  WITH CHECK (public.current_grams_role() = 'central_authority');

DROP POLICY IF EXISTS central_authority_read_complaints ON public.support_requests;
CREATE POLICY central_authority_read_complaints ON public.support_requests
  FOR SELECT TO authenticated
  USING (public.current_grams_role() = 'central_authority');
DROP POLICY IF EXISTS authenticated_users_submit_complaints ON public.support_requests;
CREATE POLICY authenticated_users_submit_complaints ON public.support_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND request_type = 'complaint'
    AND (facility_id IS NULL OR facility_id = public.current_user_facility_id()
      OR public.current_grams_role() = 'central_authority')
  );
DROP POLICY IF EXISTS central_authority_review_requests ON public.support_requests;
CREATE POLICY central_authority_review_requests ON public.support_requests
  FOR UPDATE TO authenticated
  USING (public.current_grams_role() = 'central_authority')
  WITH CHECK (public.current_grams_role() = 'central_authority');

NOTIFY pgrst, 'reload schema';
COMMIT;
