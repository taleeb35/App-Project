-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'clinic_staff');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  clinic_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create clinics table
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Add foreign key for profiles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_clinic_id_fkey
FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  license_number TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  k_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  is_veteran BOOLEAN DEFAULT false,
  preferred_vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create patient_purchases table
CREATE TABLE public.patient_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  grams DECIMAL(10,2),
  product_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patient_purchases ENABLE ROW LEVEL SECURITY;

-- Create data_uploads table
CREATE TABLE public.data_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  upload_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  records_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.data_uploads ENABLE ROW LEVEL SECURITY;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clinics
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for clinics
CREATE POLICY "Authenticated users can view clinics"
  ON public.clinics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage clinics"
  ON public.clinics FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for vendors
CREATE POLICY "Authenticated users can view vendors"
  ON public.vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage vendors"
  ON public.vendors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for patients
CREATE POLICY "Users can view patients from their clinic"
  ON public.patients FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can manage patients from their clinic"
  ON public.patients FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for patient_purchases
CREATE POLICY "Users can view purchases from their clinic patients"
  ON public.patient_purchases FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE clinic_id IN (
        SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
      )
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can manage purchases for their clinic patients"
  ON public.patient_purchases FOR ALL
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE clinic_id IN (
        SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
      )
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for data_uploads
CREATE POLICY "Users can view uploads from their clinic"
  ON public.data_uploads FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can create uploads for their clinic"
  ON public.data_uploads FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- Insert initial vendors
INSERT INTO public.vendors (name, contact_person, phone, email, status) VALUES
('Green Valley Producers', 'John Smith', '555-0101', 'john@greenvalley.com', 'active'),
('Sunset Cannabis Co.', 'Sarah Johnson', '555-0102', 'sarah@sunsetcannabis.com', 'active'),
('Mountain View Growers', 'Mike Davis', '555-0103', 'mike@mountainview.com', 'active'),
('Pacific Coast Cultivation', 'Emily Brown', '555-0104', 'emily@pacificcoast.com', 'active'),
('Desert Bloom Farms', 'Robert Wilson', '555-0105', 'robert@desertbloom.com', 'active'),
('Northern Lights Gardens', 'Lisa Anderson', '555-0106', 'lisa@northernlights.com', 'active'),
('Coastal Harvest LLC', 'David Martinez', '555-0107', 'david@coastalharvest.com', 'active'),
('Evergreen Supply Co.', 'Jennifer Taylor', '555-0108', 'jennifer@evergreensupply.com', 'active');