-- Add status field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add check constraint for status values
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'draft'));

-- Add phone field to profiles table for sub admin phone numbers
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text;