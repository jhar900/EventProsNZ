-- Add logo_url column to business_profiles table
-- This allows businesses to upload and store their logo

ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.business_profiles.logo_url IS 'URL of the business logo image stored in Supabase Storage';

