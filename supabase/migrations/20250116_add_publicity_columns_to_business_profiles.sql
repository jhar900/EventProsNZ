-- Add publicity columns to business_profiles table
-- These columns are for the Publicity section of contractor onboarding

-- Add marketing_consent column (boolean, defaults to false)
ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;

-- Add community_goals column (text, optional)
ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS community_goals TEXT;

-- Add questions column (text, optional)
ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS questions TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN public.business_profiles.marketing_consent IS 'Consent to use business information on front page and marketing materials';
COMMENT ON COLUMN public.business_profiles.community_goals IS 'What the contractor wants to gain from being part of Event Pros community';
COMMENT ON COLUMN public.business_profiles.questions IS 'Questions about Event Pros NZ that the contractor wants the team to answer';

