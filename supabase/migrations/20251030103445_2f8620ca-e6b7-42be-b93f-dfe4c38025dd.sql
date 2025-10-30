-- Create pharmacies table
CREATE TABLE public.pharmacies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  license_number TEXT,
  status TEXT DEFAULT 'active',
  clinic_id UUID REFERENCES public.clinics(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for pharmacies
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

-- Pharmacies policies
CREATE POLICY "Users can view pharmacies from their clinic"
ON public.pharmacies FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage all pharmacies"
ON public.pharmacies FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create pharmacy_reports table
CREATE TABLE public.pharmacy_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  report_month DATE NOT NULL,
  grams_sold NUMERIC,
  amount NUMERIC,
  product_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for pharmacy_reports
ALTER TABLE public.pharmacy_reports ENABLE ROW LEVEL SECURITY;

-- Pharmacy reports policies
CREATE POLICY "Employees can view their clinic's pharmacy reports"
ON public.pharmacy_reports FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_employees WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Employees can insert pharmacy reports for their clinic"
ON public.pharmacy_reports FOR INSERT
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id FROM clinic_employees WHERE user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage all pharmacy reports"
ON public.pharmacy_reports FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on pharmacies
CREATE TRIGGER update_pharmacies_updated_at
BEFORE UPDATE ON public.pharmacies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add trigger for updated_at on pharmacy_reports
CREATE TRIGGER update_pharmacy_reports_updated_at
BEFORE UPDATE ON public.pharmacy_reports
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();