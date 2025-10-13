-- Add RLS policies to allow clinic users to insert/update/delete patient-vendor links
-- without requiring admin role. This fixes Excel uploads failing to map vendors.

-- Policy: Users can insert patient-vendors for their clinic
CREATE POLICY "Users can insert patient vendors for their clinic"
ON public.patient_vendors
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    EXISTS (
      SELECT 1
      FROM public.patients p
      WHERE p.id = patient_vendors.patient_id
        AND p.clinic_id IN (
          SELECT pr.clinic_id FROM public.profiles pr WHERE pr.id = auth.uid()
        )
    )
    AND EXISTS (
      SELECT 1
      FROM public.vendors v
      WHERE v.id = patient_vendors.vendor_id
        AND v.clinic_id IN (
          SELECT pr.clinic_id FROM public.profiles pr WHERE pr.id = auth.uid()
        )
    )
  )
);

-- Policy: Users can update patient-vendors for their clinic
CREATE POLICY "Users can update patient vendors for their clinic"
ON public.patient_vendors
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    EXISTS (
      SELECT 1
      FROM public.patients p
      WHERE p.id = patient_vendors.patient_id
        AND p.clinic_id IN (
          SELECT pr.clinic_id FROM public.profiles pr WHERE pr.id = auth.uid()
        )
    )
    AND EXISTS (
      SELECT 1
      FROM public.vendors v
      WHERE v.id = patient_vendors.vendor_id
        AND v.clinic_id IN (
          SELECT pr.clinic_id FROM public.profiles pr WHERE pr.id = auth.uid()
        )
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    EXISTS (
      SELECT 1
      FROM public.patients p
      WHERE p.id = patient_vendors.patient_id
        AND p.clinic_id IN (
          SELECT pr.clinic_id FROM public.profiles pr WHERE pr.id = auth.uid()
        )
    )
    AND EXISTS (
      SELECT 1
      FROM public.vendors v
      WHERE v.id = patient_vendors.vendor_id
        AND v.clinic_id IN (
          SELECT pr.clinic_id FROM public.profiles pr WHERE pr.id = auth.uid()
        )
    )
  )
);

-- Policy: Users can delete patient-vendors for their clinic
CREATE POLICY "Users can delete patient vendors for their clinic"
ON public.patient_vendors
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    EXISTS (
      SELECT 1
      FROM public.patients p
      WHERE p.id = patient_vendors.patient_id
        AND p.clinic_id IN (
          SELECT pr.clinic_id FROM public.profiles pr WHERE pr.id = auth.uid()
        )
    )
    AND EXISTS (
      SELECT 1
      FROM public.vendors v
      WHERE v.id = patient_vendors.vendor_id
        AND v.clinic_id IN (
          SELECT pr.clinic_id FROM public.profiles pr WHERE pr.id = auth.uid()
        )
    )
  )
);
