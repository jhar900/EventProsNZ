-- Add service_type column to services table if it doesn't exist
-- This is for the contractor onboarding services table (the one with user_id, not business_profile_id)

-- Add service_type column (allow NULL for now to handle existing rows)
DO $$
BEGIN
  -- Check if services table has user_id column (contractor onboarding table)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'services' 
    AND column_name = 'user_id'
  ) THEN
    -- Add service_type column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'services' 
      AND column_name = 'service_type'
    ) THEN
      ALTER TABLE public.services ADD COLUMN service_type TEXT;
      RAISE NOTICE 'Added service_type column to services table';
    ELSE
      RAISE NOTICE 'service_type column already exists in services table';
    END IF;
  ELSE
    RAISE NOTICE 'services table does not have user_id column, skipping migration';
  END IF;
END $$;




