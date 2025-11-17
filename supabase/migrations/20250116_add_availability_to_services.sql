-- Add availability column to services table
-- This column stores availability information for services (e.g., "Weekends only", "24/7", etc.)

-- Add availability column if it doesn't exist
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS availability TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.services.availability IS 'Service availability information (e.g., "Weekends only", "24/7", etc.)';


