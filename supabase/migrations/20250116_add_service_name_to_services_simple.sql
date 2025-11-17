-- Simple direct migration to add service_name column
-- Run this if the other migration doesn't work

-- Add service_name column (allow NULL for now)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS service_name TEXT;

-- Update existing rows to use service_type as service_name
UPDATE public.services 
SET service_name = service_type 
WHERE service_name IS NULL AND service_type IS NOT NULL;


