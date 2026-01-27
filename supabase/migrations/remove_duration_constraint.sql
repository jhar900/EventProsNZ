-- Remove duration_hours constraint since we now use start/end times instead
-- Duration can be calculated from event_date and end_date when needed

DO $$
BEGIN
    -- Drop duration constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'events'
        AND constraint_name = 'valid_duration'
    ) THEN
        ALTER TABLE public.events DROP CONSTRAINT valid_duration;
    END IF;
END $$;

-- Add comment to document the change
COMMENT ON COLUMN events.duration_hours IS 'Optional duration in hours. Can be calculated from event_date and end_date when needed. NULL is allowed for all event statuses.';
