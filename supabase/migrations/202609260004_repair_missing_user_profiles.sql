-- Repair authenticated accounts whose profile row or active role is missing.
-- All repaired accounts receive patient access; staff access remains approval-only.
BEGIN;

DROP TRIGGER IF EXISTS protect_user_role_changes ON public.users;

UPDATE public.users
SET role = 'patient'::public.user_role
WHERE role IS NULL;

INSERT INTO public.users (id, name, role, phone, email, account_id, requested_role)
SELECT
  a.id,
  coalesce(nullif(a.raw_user_meta_data->>'name', ''), 'New patient'),
  'patient'::public.user_role,
  a.phone,
  a.email,
  CASE coalesce(a.raw_user_meta_data->>'requested_role', 'patient')
    WHEN 'central_authority' THEN 'CID-'
    WHEN 'phc_head' THEN 'PHH-'
    WHEN 'phc_worker' THEN 'PHW-'
    ELSE 'PID-'
  END || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
  CASE
    WHEN a.raw_user_meta_data->>'requested_role' IN ('central_authority','phc_head','phc_worker')
      THEN a.raw_user_meta_data->>'requested_role'
    ELSE 'patient'
  END
FROM auth.users a
LEFT JOIN public.users u ON u.id = a.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER protect_user_role_changes
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_change();

NOTIFY pgrst, 'reload schema';
COMMIT;
