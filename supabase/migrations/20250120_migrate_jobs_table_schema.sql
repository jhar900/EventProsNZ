-- Migration: Update jobs table to new schema
-- Description: Migrates the old jobs table schema to the new one with posted_by_user_id and budget_range columns

-- First, check if the old schema exists and migrate data if needed
DO $$
BEGIN
    -- Check if old columns exist (budget_min, budget_max) and new columns don't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'budget_min'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'budget_range_min'
    ) THEN
        -- Add new columns
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget_range_min DECIMAL(10,2);
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS budget_range_max DECIMAL(10,2);
        
        -- Migrate data from old columns to new columns
        UPDATE jobs 
        SET budget_range_min = budget_min,
            budget_range_max = budget_max
        WHERE budget_min IS NOT NULL OR budget_max IS NOT NULL;
        
        -- Drop old columns (after ensuring data is migrated)
        ALTER TABLE jobs DROP COLUMN IF EXISTS budget_min;
        ALTER TABLE jobs DROP COLUMN IF EXISTS budget_max;
    END IF;
END $$;

-- Add posted_by_user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'posted_by_user_id'
    ) THEN
        -- Add the column as nullable first (since existing rows won't have a value)
        ALTER TABLE jobs ADD COLUMN posted_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE;
        
        -- For existing jobs, we can't determine the poster, so we'll leave them NULL
        -- or set a default. For now, we'll leave them NULL and make it nullable
        -- Later, we can make it NOT NULL once all jobs have a posted_by_user_id
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_jobs_posted_by_user_id ON jobs(posted_by_user_id);
    END IF;
END $$;

-- Add other new columns if they don't exist
DO $$
BEGIN
    -- Add job_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'job_type'
    ) THEN
        ALTER TABLE jobs ADD COLUMN job_type TEXT CHECK (job_type IN ('event_manager', 'contractor_internal'));
        -- Set default for existing rows
        UPDATE jobs SET job_type = 'event_manager' WHERE job_type IS NULL;
    END IF;
    
    -- Add service_category if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'service_category'
    ) THEN
        ALTER TABLE jobs ADD COLUMN service_category TEXT;
    END IF;
    
    -- Add location if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'location'
    ) THEN
        ALTER TABLE jobs ADD COLUMN location TEXT;
    END IF;
    
    -- Add coordinates if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'coordinates'
    ) THEN
        ALTER TABLE jobs ADD COLUMN coordinates JSONB;
    END IF;
    
    -- Add is_remote if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'is_remote'
    ) THEN
        ALTER TABLE jobs ADD COLUMN is_remote BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add special_requirements if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'special_requirements'
    ) THEN
        ALTER TABLE jobs ADD COLUMN special_requirements TEXT;
    END IF;
    
    -- Add contact_email if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE jobs ADD COLUMN contact_email TEXT;
    END IF;
    
    -- Add contact_phone if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE jobs ADD COLUMN contact_phone TEXT;
    END IF;
    
    -- Add response_preferences if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'response_preferences'
    ) THEN
        ALTER TABLE jobs ADD COLUMN response_preferences TEXT CHECK (response_preferences IN ('email', 'phone', 'platform'));
    END IF;
    
    -- Add timeline_start_date if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'timeline_start_date'
    ) THEN
        ALTER TABLE jobs ADD COLUMN timeline_start_date DATE;
    END IF;
    
    -- Add timeline_end_date if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'timeline_end_date'
    ) THEN
        ALTER TABLE jobs ADD COLUMN timeline_end_date DATE;
    END IF;
    
    -- Add view_count if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'view_count'
    ) THEN
        ALTER TABLE jobs ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add application_count if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'application_count'
    ) THEN
        ALTER TABLE jobs ADD COLUMN application_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add created_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE jobs ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE jobs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update status column constraint if needed
DO $$
BEGIN
    -- Drop old constraint if it exists
    ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
    -- Add new constraint
    ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
        CHECK (status IN ('active', 'filled', 'completed', 'cancelled'));
END $$;

-- Create indexes that might be missing (only if columns exist)
DO $$
BEGIN
    -- job_type index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'job_type') THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
    END IF;
    
    -- service_category index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'service_category') THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_service_category ON jobs(service_category);
    END IF;
    
    -- status index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    END IF;
    
    -- location index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'location') THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
    END IF;
    
    -- budget_range index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'budget_range_min') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'budget_range_max') THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_budget_range ON jobs(budget_range_min, budget_range_max);
    END IF;
    
    -- created_at index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'created_at') THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
    END IF;
    
    -- event_id index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'event_id') THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_event_id ON jobs(event_id);
    END IF;
END $$;

-- Migrate job_applications table if it exists with old schema
DO $$
BEGIN
    -- Check if old schema exists (has applied_at instead of created_at)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'applied_at'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'created_at'
    ) THEN
        -- Add new columns
        ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
        
        -- Migrate data from applied_at to created_at
        UPDATE job_applications 
        SET created_at = applied_at
        WHERE created_at IS NULL AND applied_at IS NOT NULL;
        
        -- Set default for any remaining NULL values
        UPDATE job_applications 
        SET created_at = NOW()
        WHERE created_at IS NULL;
        
        UPDATE job_applications 
        SET updated_at = NOW()
        WHERE updated_at IS NULL;
        
        -- Make columns NOT NULL after setting defaults
        ALTER TABLE job_applications ALTER COLUMN created_at SET DEFAULT NOW();
        ALTER TABLE job_applications ALTER COLUMN updated_at SET DEFAULT NOW();
        ALTER TABLE job_applications ALTER COLUMN created_at SET NOT NULL;
        ALTER TABLE job_applications ALTER COLUMN updated_at SET NOT NULL;
    END IF;
    
    -- Add created_at and updated_at if they don't exist (for new tables)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Now run the rest of the migration from 20241226_create_jobs_tables.sql
-- (The table structure is now updated, so we can create the other tables and policies)

