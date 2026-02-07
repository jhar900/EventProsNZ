-- Migration: Add contact_person_id to jobs table
-- Description: Adds contact_person_id field to allow selecting a team member as the contact person for a job

DO $$
BEGIN
    -- Add contact_person_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jobs' AND column_name = 'contact_person_id'
    ) THEN
        -- Add the column as nullable (references users table)
        ALTER TABLE public.jobs ADD COLUMN contact_person_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_jobs_contact_person_id ON public.jobs(contact_person_id);

        -- For existing jobs, set contact_person_id to posted_by_user_id as default
        UPDATE public.jobs
        SET contact_person_id = posted_by_user_id
        WHERE contact_person_id IS NULL AND posted_by_user_id IS NOT NULL;
    END IF;
END $$;
