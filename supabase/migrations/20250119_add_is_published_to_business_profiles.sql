-- Add is_published column to business_profiles table
-- This column controls whether a contractor profile is visible on the public contractors page
-- and accessible via /contractor/[id] route

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_profiles' 
        AND column_name = 'is_published'
    ) THEN
        ALTER TABLE public.business_profiles 
        ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
        
        -- Add comment to document the column
        COMMENT ON COLUMN public.business_profiles.is_published IS 
        'Whether the business profile is published and visible on the contractors directory and public profile page';
        
        -- Set existing business profiles to published by default
        -- Since they were previously visible, we'll default them to published
        -- Users can opt-out by unchecking the setting
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
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_business_profiles_is_published 
ON public.business_profiles(is_published) 
WHERE is_published = true;

