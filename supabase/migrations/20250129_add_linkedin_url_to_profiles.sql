-- Add linkedin_url and website_url columns to profiles table for personal LinkedIn profile links and personal websites

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN public.profiles.linkedin_url IS 'URL to the user''s personal LinkedIn profile';
COMMENT ON COLUMN public.profiles.website_url IS 'URL to the user''s personal website';

