-- Complementary policy using clinic_employees mapping
CREATE POLICY "Employees can insert pharmacies for their clinic via assignment"
ON public.pharmacies
FOR INSERT
WITH CHECK ((clinic_id IN (
  SELECT clinic_employees.clinic_id FROM public.clinic_employees WHERE clinic_employees.user_id = auth.uid()
)) OR has_role(auth.uid(), 'admin'::app_role));