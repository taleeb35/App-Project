-- Add vendor_id column to pharmacy_reports table
ALTER TABLE public.pharmacy_reports
ADD COLUMN vendor_id UUID REFERENCES public.vendors(id);

-- Create index for better query performance
CREATE INDEX idx_pharmacy_reports_vendor_id ON public.pharmacy_reports(vendor_id);