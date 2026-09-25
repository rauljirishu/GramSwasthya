-- Guarantee an immutable, searchable code for each patient registry record.
BEGIN;

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS patient_code text;

WITH ranked_codes AS (
  SELECT id, row_number() OVER (PARTITION BY patient_code ORDER BY created_at, id) AS code_rank
  FROM public.patients
  WHERE patient_code IS NOT NULL AND btrim(patient_code) <> ''
)
UPDATE public.patients AS p
SET patient_code = 'PID-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
FROM ranked_codes AS ranked
WHERE p.id = ranked.id AND ranked.code_rank > 1;

UPDATE public.patients
SET patient_code = 'PID-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
WHERE patient_code IS NULL OR btrim(patient_code) = '';

ALTER TABLE public.patients
  ALTER COLUMN patient_code SET DEFAULT ('PID-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))),
  ALTER COLUMN patient_code SET NOT NULL;

-- Keep a selected public or community-mapped destination even when it is not
-- a GramCare facility row and therefore cannot be stored in facility_id.
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS preferred_facility_name text,
  ADD COLUMN IF NOT EXISTS preferred_facility_address text,
  ADD COLUMN IF NOT EXISTS preferred_facility_latitude double precision,
  ADD COLUMN IF NOT EXISTS preferred_facility_longitude double precision,
  ADD COLUMN IF NOT EXISTS preferred_facility_phone text;

CREATE UNIQUE INDEX IF NOT EXISTS patients_patient_code_unique_idx
  ON public.patients (patient_code);

NOTIFY pgrst, 'reload schema';
COMMIT;
