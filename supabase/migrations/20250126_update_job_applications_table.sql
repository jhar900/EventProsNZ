-- Update job_applications table
-- 1. Rename cover_letter to application_message (if not already renamed)
-- 2. Add attachments JSONB column if it doesn't exist

DO $$
BEGIN
    -- Rename cover_letter to application_message if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_applications'
        AND column_name = 'cover_letter'
    ) THEN
        ALTER TABLE public.job_applications
        RENAME COLUMN cover_letter TO application_message;
        
        COMMENT ON COLUMN public.job_applications.application_message IS
        'Application message from the contractor';
    END IF;

    -- Add attachments column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_applications'
        AND column_name = 'attachments'
    ) THEN
        ALTER TABLE public.job_applications
        ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN public.job_applications.attachments IS
        'Array of file URLs for job application attachments';
    END IF;
END $$;


