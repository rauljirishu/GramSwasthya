-- Restrict patient registration and editing to staff assigned to a PHC.
-- The existing PID generator/default remains responsible for unique patient IDs.
BEGIN;

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS alternate_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

-- Remove historical permissive policies: PostgreSQL combines permissive policies
-- with OR, so leaving an old broad INSERT policy would still permit patient signup.
DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'patients'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.patients', policy_name);
  END LOOP;
END $$;

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY phc_scoped_patient_read ON public.patients
  FOR SELECT TO authenticated
  USING (public.can_access_care_patient(id));

CREATE POLICY phc_staff_register_patients ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_grams_role() IN ('phc_head', 'phc_worker')
    AND registered_by = auth.uid()
    AND registered_phc_id IS NOT NULL
    AND registered_phc_id = public.current_user_facility_id()
  );

CREATE POLICY phc_staff_update_assigned_patients ON public.patients
  FOR UPDATE TO authenticated
  USING (
    public.current_grams_role() IN ('phc_head', 'phc_worker')
    AND registered_phc_id = public.current_user_facility_id()
  )
  WITH CHECK (
    public.current_grams_role() IN ('phc_head', 'phc_worker')
    AND registered_phc_id = public.current_user_facility_id()
  );

GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
