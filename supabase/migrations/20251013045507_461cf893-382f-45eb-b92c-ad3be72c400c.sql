-- Create junction table for patient-vendor relationships
CREATE TABLE IF NOT EXISTS public.patient_vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(patient_id, vendor_id)
);

-- Enable RLS
ALTER TABLE public.patient_vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patient_vendors
CREATE POLICY "Users can view patient vendors from their clinic"
ON public.patient_vendors
FOR SELECT
USING (
  patient_id IN (
    SELECT id FROM public.patients
    WHERE clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    )
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage all patient vendors"
ON public.patient_vendors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance
CREATE INDEX idx_patient_vendors_patient_id ON public.patient_vendors(patient_id);
CREATE INDEX idx_patient_vendors_vendor_id ON public.patient_vendors(vendor_id);