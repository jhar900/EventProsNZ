-- Delete Test Contractor Data Script
-- This script deletes all test contractors created by seed-test-contractors.sql
-- All test contractors use @test.eventpros.local email domain

-- Safety check: Only allow deletion in development
DO $$
BEGIN
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'This script should only be run in development environments';
  END IF;
END $$;

-- Delete test contractors and all related data
-- Due to CASCADE constraints, deleting from users will automatically delete:
-- - profiles
-- - business_profiles
-- - services
-- - portfolio
-- - contractor_testimonials
-- - contractor_onboarding_status
-- And other related records

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete users with test email domain
  DELETE FROM public.users 
  WHERE email LIKE '%@test.eventpros.local';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % test contractor(s) and all related data', deleted_count;
  RAISE NOTICE 'All related records (profiles, business_profiles, services, portfolio, testimonials) were automatically deleted due to CASCADE constraints.';
END $$;

