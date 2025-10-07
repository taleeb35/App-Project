-- Update patients table with new fields
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS prescription_status text DEFAULT 'active';

-- Add comment to explain the table
COMMENT ON TABLE public.patients IS 'Stores patient information for each clinic including prescription status';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_k_number ON public.patients(k_number);
CREATE INDEX IF NOT EXISTS idx_patients_prescription_status ON public.patients(prescription_status);