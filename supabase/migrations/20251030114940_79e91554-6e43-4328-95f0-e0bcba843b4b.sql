-- Drop the old policy
DROP POLICY IF EXISTS "Users can view vendors from their clinic" ON public.vendors;

-- Create a new policy that allows viewing vendors from their clinic OR vendors that appear in their clinic's reports
CREATE POLICY "Users can view vendors from their clinic or reports" 
ON public.vendors 
FOR SELECT 
USING (
  -- Can view vendors assigned to their clinic
  (clinic_id IN (
    SELECT profiles.clinic_id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  ))
  OR 
  -- Can view vendors that appear in vendor reports for their clinic
  (id IN (
    SELECT DISTINCT vendor_id 
    FROM vendor_reports 
    WHERE clinic_id IN (
      SELECT profiles.clinic_id 
      FROM profiles 
      WHERE profiles.id = auth.uid()
    )
  ))
  OR 
  -- Can view vendors that appear in pharmacy reports for their clinic
  (id IN (
    SELECT DISTINCT vendor_id 
    FROM pharmacy_reports 
    WHERE clinic_id IN (
      SELECT profiles.clinic_id 
      FROM profiles 
      WHERE profiles.id = auth.uid()
    )
  ))
  OR 
  -- Admins can view all vendors
  has_role(auth.uid(), 'admin'::app_role)
);