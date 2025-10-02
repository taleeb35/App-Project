-- 1. Assign admin role to the admin user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@weblerzdemo.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Add clinic_id to vendors table to support multi-clinic setup
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL;

-- 3. Add vendor_id to patients table so each vendor maintains its own patient list
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL;

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_clinic_id ON public.vendors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_vendor_id ON public.patients(vendor_id);

-- 5. Update RLS policies for vendors to respect clinic context
DROP POLICY IF EXISTS "Admins can manage vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can view vendors" ON public.vendors;

CREATE POLICY "Admins can manage all vendors"
ON public.vendors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view vendors from their clinic"
ON public.vendors
FOR SELECT
USING (
  clinic_id IN (
    SELECT clinic_id FROM profiles WHERE id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);