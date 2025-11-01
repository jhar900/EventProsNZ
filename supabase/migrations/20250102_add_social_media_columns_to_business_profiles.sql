-- Add social media columns to business_profiles table
-- These columns store individual social media platform URLs

ALTER TABLE public.business_profiles
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN public.business_profiles.facebook_url IS 'URL to the business Facebook page or profile';
COMMENT ON COLUMN public.business_profiles.instagram_url IS 'URL to the business Instagram profile';
COMMENT ON COLUMN public.business_profiles.linkedin_url IS 'URL to the business LinkedIn page or profile';
COMMENT ON COLUMN public.business_profiles.twitter_url IS 'URL to the business Twitter/X profile';
COMMENT ON COLUMN public.business_profiles.youtube_url IS 'URL to the business YouTube channel';
COMMENT ON COLUMN public.business_profiles.tiktok_url IS 'URL to the business TikTok profile';

