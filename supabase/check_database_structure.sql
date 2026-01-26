-- SQL queries to check database structure for events and drafts
-- Run these in Supabase SQL Editor to inspect the current schema

-- 1. Check events table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'events'
ORDER BY ordinal_position;

-- 2. Check if location_data column exists and its type
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'events'
    AND column_name = 'location_data';

-- 3. Check event_drafts table structure (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'event_drafts'
ORDER BY ordinal_position;

-- 4. Sample query to see what's currently in location_data for a draft event
-- First check if location_data column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'events' 
            AND column_name = 'location_data'
        ) THEN 'Column exists'
        ELSE 'Column does NOT exist - need to run migration'
    END as location_data_status;

-- If column exists, show sample data
SELECT 
    id,
    title,
    status,
    event_date,
    location,
    location_data,
    jsonb_typeof(location_data) as location_data_type
FROM events
WHERE status = 'draft'
    AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'location_data'
    )
LIMIT 5;

-- 5. Check constraints on events table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.events'::regclass
ORDER BY conname;

-- 6. Check indexes on events table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'events'
    AND schemaname = 'public';

-- 7. Sample query to inspect location_data structure for events with dates
-- Only run if location_data column exists
SELECT 
    id,
    title,
    status,
    event_date,
    location_data->'startTime' as start_time,
    location_data->'endTime' as end_time,
    location_data->'additionalDates' as additional_dates,
    jsonb_array_length(location_data->'additionalDates') as additional_dates_count
FROM events
WHERE location_data IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events' 
        AND column_name = 'location_data'
    )
LIMIT 10;

