-- Setup migration system and versioning
-- This migration creates a migration tracking system

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS public.migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checksum VARCHAR(64),
  execution_time_ms INTEGER
);

-- Insert current migrations
INSERT INTO public.migrations (version, name, applied_at, execution_time_ms) VALUES
  ('001', 'initial_schema_with_performance', NOW(), 0),
  ('002', 'align_enums_with_typescript', NOW(), 0),
  ('003', 'enhance_data_validation', NOW(), 0),
  ('004', 'enhance_rls_policies', NOW(), 0),
  ('005', 'setup_migration_system', NOW(), 0)
ON CONFLICT (version) DO NOTHING;

-- Create function to check migration status
CREATE OR REPLACE FUNCTION check_migration_status()
RETURNS TABLE (
  version VARCHAR(50),
  name VARCHAR(255),
  applied_at TIMESTAMP WITH TIME ZONE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.version,
    m.name,
    m.applied_at,
    CASE 
      WHEN m.applied_at IS NOT NULL THEN 'applied'
      ELSE 'pending'
    END as status
  FROM public.migrations m
  ORDER BY m.version;
END;
$$ LANGUAGE plpgsql;

-- Create function to get database version
CREATE OR REPLACE FUNCTION get_database_version()
RETURNS VARCHAR(50) AS $$
BEGIN
  RETURN (
    SELECT version 
    FROM public.migrations 
    ORDER BY applied_at DESC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to validate database integrity
CREATE OR REPLACE FUNCTION validate_database_integrity()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  message TEXT
) AS $$
BEGIN
  -- Check if all required tables exist
  RETURN QUERY
  SELECT 
    'Required Tables' as check_name,
    CASE 
      WHEN COUNT(*) = 12 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    'Expected 12 tables, found ' || COUNT(*) as message
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN (
      'users', 'profiles', 'business_profiles', 'events', 'services',
      'event_services', 'event_service_assignments', 'enquiries', 
      'enquiry_messages', 'jobs', 'job_applications', 'testimonials',
      'subscriptions', 'portfolio_items'
    );

  -- Check if RLS is enabled on all tables
  RETURN QUERY
  SELECT 
    'Row Level Security' as check_name,
    CASE 
      WHEN COUNT(*) = 14 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    'Expected 14 tables with RLS, found ' || COUNT(*) as message
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND rowsecurity = true;

  -- Check if all required indexes exist
  RETURN QUERY
  SELECT 
    'Performance Indexes' as check_name,
    CASE 
      WHEN COUNT(*) >= 20 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    'Expected at least 20 indexes, found ' || COUNT(*) as message
  FROM pg_indexes 
  WHERE schemaname = 'public';

  -- Check if all required functions exist
  RETURN QUERY
  SELECT 
    'Required Functions' as check_name,
    CASE 
      WHEN COUNT(*) >= 3 THEN 'PASS'
      ELSE 'FAIL'
    END as status,
    'Expected at least 3 functions, found ' || COUNT(*) as message
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for migration functions
GRANT EXECUTE ON FUNCTION check_migration_status() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_database_version() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_database_integrity() TO anon, authenticated;
