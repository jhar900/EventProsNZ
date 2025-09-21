# Database Migration Guide - Event Pros NZ

**Date:** $(date)  
**Project:** Event Pros NZ  
**Purpose:** Migrate from old schema to new production-ready schema

## Current Status

### Old Schema (To be removed):
- `Contractors` (incorrect casing)
- `users` (basic structure)
- `testimonails` (typo in name)
- `businesses` (should be business_profiles)

### New Schema (To be applied):
- Comprehensive 15-table structure
- Proper relationships and foreign keys
- Performance optimizations
- Row Level Security (RLS)
- Full-text search capabilities
- Automated triggers and functions

## Migration Steps

### Step 1: Backup Current Data (Optional)
If you have any important data in the old tables, back it up first:

```sql
-- Create backup tables (if needed)
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE contractors_backup AS SELECT * FROM "Contractors";
CREATE TABLE businesses_backup AS SELECT * FROM businesses;
CREATE TABLE testimonails_backup AS SELECT * FROM testimonails;
```

### Step 2: Clean Up Old Schema
Remove the old tables and any related constraints:

```sql
-- Drop old tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS "testimonails" CASCADE;
DROP TABLE IF EXISTS "Contractors" CASCADE;
DROP TABLE IF EXISTS "businesses" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop any custom types that might conflict
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS enquiry_status CASCADE;
```

### Step 3: Apply New Schema
Run the complete migration file:

```sql
-- Execute the entire migration file
-- Copy and paste the contents of supabase/migrations/001_initial_schema_with_performance.sql
```

### Step 4: Verify Schema Application
Check that all tables and relationships are created correctly:

```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- business_profiles
-- enquiry_messages
-- enquiries
-- event_service_assignments
-- event_services
-- events
-- job_applications
-- jobs
-- portfolio_items
-- profiles
-- services
-- subscriptions
-- testimonials
-- users
```

### Step 5: Test Basic Functionality
Verify the schema works correctly:

```sql
-- Test user creation
INSERT INTO public.users (id, email, role) 
VALUES (gen_random_uuid(), 'test@example.com', 'event_manager');

-- Test profile creation
INSERT INTO public.profiles (user_id, first_name, last_name)
SELECT id, 'Test', 'User' FROM public.users WHERE email = 'test@example.com';

-- Test business profile creation
INSERT INTO public.business_profiles (user_id, company_name, description)
SELECT id, 'Test Company', 'Test Description' FROM public.users WHERE email = 'test@example.com';

-- Clean up test data
DELETE FROM public.business_profiles WHERE user_id IN (SELECT id FROM public.users WHERE email = 'test@example.com');
DELETE FROM public.profiles WHERE user_id IN (SELECT id FROM public.users WHERE email = 'test@example.com');
DELETE FROM public.users WHERE email = 'test@example.com';
```

### Step 6: Verify RLS Policies
Check that Row Level Security is working:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Should show all tables with rowsecurity = true
```

### Step 7: Test Performance Indexes
Verify indexes are created:

```sql
-- Check indexes
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Rollback Plan

If something goes wrong, you can rollback:

```sql
-- Drop all new tables
DROP TABLE IF EXISTS public.portfolio_items CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.testimonials CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.enquiry_messages CASCADE;
DROP TABLE IF EXISTS public.enquiries CASCADE;
DROP TABLE IF EXISTS public.event_service_assignments CASCADE;
DROP TABLE IF EXISTS public.event_services CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.business_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS enquiry_status CASCADE;

-- Restore from backup (if you created one)
-- CREATE TABLE users AS SELECT * FROM users_backup;
-- etc.
```

## Post-Migration Checklist

- [ ] All 15 tables created successfully
- [ ] All foreign key relationships working
- [ ] RLS policies enabled on all tables
- [ ] Performance indexes created
- [ ] Triggers and functions working
- [ ] Test data can be inserted
- [ ] Basic queries work correctly
- [ ] No error messages in Supabase logs

## Next Steps

After successful migration:
1. Update your application code to use new table names
2. Test all CRUD operations
3. Verify authentication integration
4. Test real-time subscriptions
5. Performance test with sample data
