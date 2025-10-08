-- Create clinic_employees table for managing employee access to clinics
CREATE TABLE IF NOT EXISTS public.clinic_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);

-- Enable RLS
ALTER TABLE public.clinic_employees ENABLE ROW LEVEL SECURITY;

-- Policies for clinic_employees
CREATE POLICY "Admins can manage clinic employees"
  ON public.clinic_employees
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own clinic assignments"
  ON public.clinic_employees
  FOR SELECT
  USING (auth.uid() = user_id);

-- Update profiles table to link to clinic through clinic_employees
-- This is already handled by the clinic_employees table

-- Create patient_vendor_usage table to track which vendors patients use
CREATE TABLE IF NOT EXISTS public.patient_vendor_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  usage_month DATE NOT NULL,
  grams_purchased NUMERIC(10,2),
  amount_spent NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_vendor_usage ENABLE ROW LEVEL SECURITY;

-- Policies for patient_vendor_usage
CREATE POLICY "Admins can manage all patient vendor usage"
  ON public.patient_vendor_usage
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their clinic's patient vendor usage"
  ON public.patient_vendor_usage
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_employees WHERE user_id = auth.uid()
    )
  );

-- Create vendor_reports table for uploaded vendor data
CREATE TABLE IF NOT EXISTS public.vendor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  report_month DATE NOT NULL,
  product_name TEXT,
  grams_sold NUMERIC(10,2),
  amount NUMERIC(10,2),
  is_dummy BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_reports ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_reports
CREATE POLICY "Admins can manage all vendor reports"
  ON public.vendor_reports
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their clinic's vendor reports"
  ON public.vendor_reports
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.clinic_employees WHERE user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_patient_vendor_usage_updated_at
  BEFORE UPDATE ON public.patient_vendor_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_vendor_reports_updated_at
  BEFORE UPDATE ON public.vendor_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add is_dummy flag to patients table for dummy data management
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;

-- Add is_dummy flag to vendors table
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;