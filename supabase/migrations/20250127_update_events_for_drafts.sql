-- Update events table to support drafts
-- This allows drafts to be stored directly in the events table with status = 'draft'

-- Add draft_step column to track wizard progress
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS draft_step INTEGER DEFAULT 1;

-- Keep title as NOT NULL (required even for drafts)
-- Make event_date nullable for drafts
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'event_date'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.events ALTER COLUMN event_date DROP NOT NULL;
    END IF;
END $$;

-- Make attendee_count nullable for drafts
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'attendee_count'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.events ALTER COLUMN attendee_count DROP NOT NULL;
    END IF;
END $$;

-- Make duration_hours nullable for drafts
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'duration_hours'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.events ALTER COLUMN duration_hours DROP NOT NULL;
    END IF;
END $$;

-- Make budget nullable for drafts
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'budget'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.events ALTER COLUMN budget DROP NOT NULL;
    END IF;
END $$;

-- Update constraints to allow NULL/0 values when status = 'draft'
-- Drop existing constraints that prevent NULL/0 values
DO $$
BEGIN
    -- Drop attendee_count constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'events'
        AND constraint_name = 'valid_attendee_count'
    ) THEN
        ALTER TABLE public.events DROP CONSTRAINT valid_attendee_count;
    END IF;

    -- Drop duration constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'events'
        AND constraint_name = 'valid_duration'
    ) THEN
        ALTER TABLE public.events DROP CONSTRAINT valid_duration;
    END IF;
END $$;

-- Add new constraints that allow NULL/0 for drafts
ALTER TABLE public.events
ADD CONSTRAINT valid_attendee_count 
  CHECK (
    status = 'draft' OR 
    (attendee_count IS NOT NULL AND attendee_count > 0 AND attendee_count <= 10000)
  );

ALTER TABLE public.events
ADD CONSTRAINT valid_duration 
  CHECK (
    status = 'draft' OR 
    (duration_hours IS NOT NULL AND duration_hours > 0 AND duration_hours <= 168)
  );

-- Drop location NOT NULL constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events'
        AND column_name = 'location'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.events ALTER COLUMN location DROP NOT NULL;
    END IF;
END $$;

-- Update location validation constraint to allow NULL for drafts
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'events'
        AND constraint_name = 'valid_location'
    ) THEN
        ALTER TABLE public.events DROP CONSTRAINT valid_location;
    END IF;
END $$;

ALTER TABLE public.events
ADD CONSTRAINT valid_location 
  CHECK (
    status = 'draft' OR 
    (location IS NOT NULL AND length(trim(location)) > 0)
  );

-- Update title validation constraint - title is required even for drafts
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'events'
        AND constraint_name = 'valid_event_title'
    ) THEN
        ALTER TABLE public.events DROP CONSTRAINT valid_event_title;
    END IF;
END $$;

ALTER TABLE public.events
ADD CONSTRAINT valid_event_title 
  CHECK (
    title IS NOT NULL AND length(trim(title)) > 0 AND length(title) <= 200
  );

-- Create index on draft_step for faster queries
CREATE INDEX IF NOT EXISTS idx_events_draft_step ON public.events(draft_step) WHERE status = 'draft';

-- Create index on status for faster draft queries
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status) WHERE status = 'draft';

