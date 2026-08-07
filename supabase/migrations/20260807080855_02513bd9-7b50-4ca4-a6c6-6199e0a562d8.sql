ALTER TABLE public.patient_vendors ADD COLUMN IF NOT EXISTS client_id text;

CREATE UNIQUE INDEX IF NOT EXISTS patient_vendors_vendor_client_id_key
  ON public.patient_vendors (vendor_id, client_id)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS patient_vendors_client_id_idx
  ON public.patient_vendors (client_id)
  WHERE client_id IS NOT NULL;