-- Migration to add location_data column to events table if it doesn't exist
-- This column stores location information plus startTime, endTime, and additionalDates

-- Add location_data column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'location_data'
    ) THEN
        ALTER TABLE public.events 
        ADD COLUMN location_data JSONB;
        
        RAISE NOTICE 'location_data column added to events table';
    ELSE
        RAISE NOTICE 'location_data column already exists';
    END IF;
END $$;

-- Create an index on location_data for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_events_location_data 
ON public.events USING GIN (location_data);

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'events'
    AND column_name = 'location_data';

