-- Schema inspection for events and event_dates tables
-- Lists all columns in each table
-- 
-- For detailed schema documentation, see: docs/database-schema.md

-- Columns in 'events' table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'events'
ORDER BY ordinal_position;

-- Columns in 'event_dates' table (if it exists)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'event_dates'
ORDER BY ordinal_position;
