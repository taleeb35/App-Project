-- Step 1: Create the Super Admin User
-- This script creates a new user with the specified credentials and assigns them the 'admin' role,
-- which we will use to identify Super Admins.

DO $$
DECLARE
    user_id uuid;
    user_email TEXT := 'ceo@weblerzdemo.com';
    user_password TEXT := 'shineE065';
BEGIN
    -- Create the user in Supabase's authentication system
    user_id := auth.uid() FROM auth.users WHERE email = user_email;

    IF user_id IS NULL THEN
        user_id := extensions.uuid_generate_v4();
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', user_email, crypt(user_password, gen_salt('bf')), now(), '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', now(), now());

        INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        VALUES (extensions.uuid_generate_v4(), user_id, user_email, format('{"sub":"%s","email":"%s"}', user_id, user_email)::jsonb, 'email', now(), now(), now());
    END IF;

    -- Insert the corresponding user profile into the public 'users' table with the 'admin' role
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
        INSERT INTO public.users (id, email, first_name, last_name, app_role)
        VALUES (user_id, user_email, 'Super', 'Admin', 'admin');
    ELSE
        UPDATE public.users
        SET app_role = 'admin'
        WHERE id = user_id;
    END IF;

END $$;


-- Step 2: Update Row Level Security (RLS) Policies
-- These policies ensure that Super Admins ('admin') can see all data, while Sub Admins ('clinic_staff')
-- can only see data for their assigned clinic.

-- For the 'patients' table
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.patients;
CREATE POLICY "Enable read access for users based on role" ON public.patients
FOR SELECT USING (
  (get_my_claim('app_role')::text = 'admin') OR
  (get_my_claim('app_role')::text = 'clinic_staff' AND clinic_id = get_my_claim('clinic_id')::uuid)
);
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.patients;
CREATE POLICY "Enable insert for users based on role" ON public.patients
FOR INSERT WITH CHECK (
  (get_my_claim('app_role')::text = 'admin') OR
  (get_my_claim('app_role')::text = 'clinic_staff' AND clinic_id = get_my_claim('clinic_id')::uuid)
);
DROP POLICY IF EXISTS "Enable update for users based on role" ON public.patients;
CREATE POLICY "Enable update for users based on role" ON public.patients
FOR UPDATE USING (
  (get_my_claim('app_role')::text = 'admin') OR
  (get_my_claim('app_role')::text = 'clinic_staff' AND clinic_id = get_my_claim('clinic_id')::uuid)
);
DROP POLICY IF EXISTS "Enable delete for users based on role" ON public.patients;
CREATE POLICY "Enable delete for users based on role" ON public.patients
FOR DELETE USING (
  (get_my_claim('app_role')::text = 'admin')
);


-- For the 'vendors' table
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vendors;
CREATE POLICY "Enable read access for users based on role" ON public.vendors
FOR SELECT USING (
  (get_my_claim('app_role')::text = 'admin') OR
  (get_my_claim('app_role')::text = 'clinic_staff' AND clinic_id = get_my_claim('clinic_id')::uuid)
);


-- For the 'vendor_reports' table
ALTER TABLE public.vendor_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vendor_reports;
CREATE POLICY "Enable read access for users based on role" ON public.vendor_reports
FOR SELECT USING (
  (get_my_claim('app_role')::text = 'admin') OR
  (get_my_claim('app_role')::text = 'clinic_staff' AND clinic_id = get_my_claim('clinic_id')::uuid)
);