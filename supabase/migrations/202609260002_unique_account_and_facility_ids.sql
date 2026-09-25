-- Issue stable identifiers for all four signup types and every PHC facility.
-- Public signup always receives the patient role; staff roles remain approval-gated.
BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_id text,
  ADD COLUMN IF NOT EXISTS requested_role text NOT NULL DEFAULT 'patient';

UPDATE public.users
SET requested_role = CASE
  WHEN role::text IN ('admin','medical_officer','central_authority') THEN 'central_authority'
  WHEN role::text IN ('phc_head','head') THEN 'phc_head'
  WHEN role::text IN ('phc_worker','worker','asha','anm') THEN 'phc_worker'
  ELSE 'patient'
END;

UPDATE public.users
SET account_id = (CASE requested_role
  WHEN 'central_authority' THEN 'CID-'
  WHEN 'phc_head' THEN 'PHH-'
  WHEN 'phc_worker' THEN 'PHW-'
  ELSE 'PID-'
END) || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
WHERE account_id IS NULL OR btrim(account_id) = '';

ALTER TABLE public.users ALTER COLUMN account_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_account_id_unique_idx ON public.users(account_id);
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_requested_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_requested_role_check
  CHECK (requested_role IN ('central_authority','phc_head','phc_worker','patient'));

-- Backfill missing facility codes and make all newly registered PHCs self-numbering.
WITH duplicate_codes AS (
  SELECT id, row_number() OVER (PARTITION BY code ORDER BY created_at, id) AS duplicate_rank
  FROM public.facilities
  WHERE code IS NOT NULL AND btrim(code) <> ''
)
UPDATE public.facilities f
SET code = 'PHC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
FROM duplicate_codes d
WHERE f.id = d.id AND d.duplicate_rank > 1;

UPDATE public.facilities
SET code = 'PHC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
WHERE code IS NULL OR btrim(code) = '';

ALTER TABLE public.facilities ALTER COLUMN code SET DEFAULT
  ('PHC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)));
CREATE UNIQUE INDEX IF NOT EXISTS facilities_code_unique_idx ON public.facilities(code);

-- Auth metadata may choose a requested workspace, but can never choose its actual role.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested text;
  prefix text;
  chosen_id text;
BEGIN
  requested := lower(coalesce(new.raw_user_meta_data->>'requested_role', 'patient'));
  IF requested NOT IN ('central_authority','phc_head','phc_worker','patient') THEN
    requested := 'patient';
  END IF;
  prefix := CASE requested
    WHEN 'central_authority' THEN 'CID'
    WHEN 'phc_head' THEN 'PHH'
    WHEN 'phc_worker' THEN 'PHW'
    ELSE 'PID'
  END;
  chosen_id := new.raw_user_meta_data->>'account_id';
  IF chosen_id IS NULL OR chosen_id !~ ('^' || prefix || '-[A-Fa-f0-9]{16}$') THEN
    chosen_id := prefix || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));
  ELSE
    chosen_id := upper(chosen_id);
  END IF;

  INSERT INTO public.users (id, name, role, phone, email, account_id, requested_role)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'name', 'New patient'), 'patient'::public.user_role,
    new.phone, new.email, chosen_id, requested)
  ON CONFLICT (id) DO UPDATE SET name = excluded.name, email = excluded.email;
  RETURN new;
END;
$$;

-- A user's issued identifier and original signup request are immutable.
CREATE OR REPLACE FUNCTION public.keep_account_identifiers_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.account_id IS DISTINCT FROM OLD.account_id THEN
    RAISE EXCEPTION 'Issued account IDs cannot be changed';
  END IF;
  IF NEW.requested_role IS DISTINCT FROM OLD.requested_role
    AND public.current_grams_role() <> 'central_authority' THEN
    RAISE EXCEPTION 'Only Central Authority can change a requested role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS keep_account_identifiers_immutable ON public.users;
CREATE TRIGGER keep_account_identifiers_immutable
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.keep_account_identifiers_immutable();

NOTIFY pgrst, 'reload schema';
COMMIT;
