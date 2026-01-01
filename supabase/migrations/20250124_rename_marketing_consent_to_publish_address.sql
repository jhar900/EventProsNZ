-- Rename marketing_consent column to publish_address
-- Update the column description to reflect its new purpose

DO $$
BEGIN
    -- Check if the column exists and rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_profiles' 
        AND column_name = 'marketing_consent'
    ) THEN
        ALTER TABLE public.business_profiles 
        RENAME COLUMN marketing_consent TO publish_address;
        
        -- Update the column comment
        COMMENT ON COLUMN public.business_profiles.publish_address IS 
        'Consent to publish the business address on maps and on business profile pages';
    END IF;
END $$;

