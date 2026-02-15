-- Migration: Add budget_type and related columns to jobs table
-- Description: Adds budget_type enum and additional budget columns for different pricing models

-- Add budget_type column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jobs' AND column_name = 'budget_type'
    ) THEN
        ALTER TABLE jobs ADD COLUMN budget_type TEXT
            CHECK (budget_type IN ('range', 'fixed', 'open', 'hourly', 'daily'))
            DEFAULT 'range';
    END IF;
END $$;

-- Add budget_fixed column for fixed price jobs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jobs' AND column_name = 'budget_fixed'
    ) THEN
        ALTER TABLE jobs ADD COLUMN budget_fixed DECIMAL(10,2);
    END IF;
END $$;

-- Add hourly_rate column for hourly rate jobs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jobs' AND column_name = 'hourly_rate'
    ) THEN
        ALTER TABLE jobs ADD COLUMN hourly_rate DECIMAL(10,2);
    END IF;
END $$;

-- Add daily_rate column for daily rate jobs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jobs' AND column_name = 'daily_rate'
    ) THEN
        ALTER TABLE jobs ADD COLUMN daily_rate DECIMAL(10,2);
    END IF;
END $$;

-- Set budget_type to 'range' for existing jobs that have budget_range_min or budget_range_max
UPDATE jobs
SET budget_type = 'range'
WHERE budget_type IS NULL
  AND (budget_range_min IS NOT NULL OR budget_range_max IS NOT NULL);

-- Set budget_type to 'open' for jobs with no budget info
UPDATE jobs
SET budget_type = 'open'
WHERE budget_type IS NULL;

-- Create index on budget_type
CREATE INDEX IF NOT EXISTS idx_jobs_budget_type ON jobs(budget_type);
