-- Add service_name column to services table if it doesn't exist
-- This is for the contractor onboarding services table (the one with user_id, not business_profile_id)

-- Simple approach: Just add the column if it doesn't exist
-- We'll handle making it NOT NULL in a separate step if needed

-- First, check if the table has user_id (contractor onboarding table) and add service_name
DO $$
BEGIN
  -- Check if services table has user_id column (contractor onboarding table)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'services' 
    AND column_name = 'user_id'
  ) THEN
    -- Add service_name column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'services' 
      AND column_name = 'service_name'
    ) THEN
      ALTER TABLE public.services ADD COLUMN service_name TEXT;
      RAISE NOTICE 'Added service_name column to services table';
    ELSE
      RAISE NOTICE 'service_name column already exists in services table';
    END IF;
  ELSE
    RAISE NOTICE 'services table does not have user_id column, skipping migration';
  END IF;
END $$;

-- Update existing rows: set service_name = service_type if service_type exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'services' 
    AND column_name = 'service_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'services' 
    AND column_name = 'service_type'
  ) THEN
    UPDATE public.services 
    SET service_name = service_type 
    WHERE service_name IS NULL AND service_type IS NOT NULL;
    RAISE NOTICE 'Updated existing rows: set service_name = service_type';
  END IF;
END $$;

