CREATE POLICY "Employees can delete vendor reports for their clinic"
ON public.vendor_reports FOR DELETE TO authenticated
USING (clinic_id IN (SELECT clinic_id FROM public.clinic_employees WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can update vendor reports for their clinic"
ON public.vendor_reports FOR UPDATE TO authenticated
USING (clinic_id IN (SELECT clinic_id FROM public.clinic_employees WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.clinic_employees WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_reports TO authenticated;