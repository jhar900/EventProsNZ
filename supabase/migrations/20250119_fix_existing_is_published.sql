-- Fix existing business_profiles to set is_published = true
-- This is a one-time data fix for contractors that were created before the is_published column was added
-- Run this if you've already run the initial migration and need to fix existing data

-- Set all existing business profiles to published by default
-- Since they were previously visible, we'll default them to published
UPDATE public.business_profiles 
SET is_published = TRUE 
WHERE is_published IS NULL OR is_published = FALSE;

-- Also sync from profiles.preferences.publish_to_contractors if it exists
-- This ensures consistency with existing user preferences
UPDATE public.business_profiles bp
SET is_published = COALESCE(
    (p.preferences->>'publish_to_contractors')::boolean,
    TRUE  -- Default to true if preference doesn't exist
)
FROM public.profiles p
WHERE bp.user_id = p.user_id
AND (bp.is_published IS NULL OR bp.is_published = FALSE);

