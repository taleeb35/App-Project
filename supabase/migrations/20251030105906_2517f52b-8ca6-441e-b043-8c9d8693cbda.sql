-- Allow clinic employees to insert their clinic's pharmacy
CREATE POLICY "Users can insert pharmacies for their clinic"
ON public.pharmacies
FOR INSERT
WITH CHECK ((clinic_id IN (
  SELECT profiles.clinic_id FROM public.profiles WHERE profiles.id = auth.uid()
)) OR has_role(auth.uid(), 'admin'::app_role));

-- Optional: allow updating pharmacy details by clinic employees
CREATE POLICY "Users can update pharmacies for their clinic"
ON public.pharmacies
FOR UPDATE
USING ((clinic_id IN (
  SELECT profiles.clinic_id FROM public.profiles WHERE profiles.id = auth.uid()
)) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((clinic_id IN (
  SELECT profiles.clinic_id FROM public.profiles WHERE profiles.id = auth.uid()
)) OR has_role(auth.uid(), 'admin'::app_role));