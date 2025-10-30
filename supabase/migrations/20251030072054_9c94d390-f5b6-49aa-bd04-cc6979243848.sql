-- Add RLS policy to allow employees to insert vendor reports for their clinic
CREATE POLICY "Employees can insert vendor reports for their clinic"
ON public.vendor_reports
FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id IN (
    SELECT clinic_id 
    FROM public.clinic_employees 
    WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);