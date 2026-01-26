# Draft Save Implementation - Dates and Times

## Overview

The draft save functionality ensures all dates and times (including start/finish times and additional dates) are properly saved to the database using the correct schema structure.

## Database Structure

### Events Table

Drafts are stored in the `events` table with `status = 'draft'`. The table includes:

- `event_date` (TIMESTAMP WITH TIME ZONE) - Main event date combined with start time
- `end_date` (TIMESTAMP WITH TIME ZONE) - End date combined with end time
- `is_multi_day` (BOOLEAN) - Indicates if there are additional dates

### Event Dates Table

Additional dates for multi-day events are stored in the `event_dates` table:

- `event_id` (UUID) - Foreign key to `events(id)`
- `date` (DATE) - The date for this additional day (YYYY-MM-DD)
- `start_time` (TIME WITHOUT TIME ZONE) - Start time (HH:MM:SS)
- `end_time` (TIME WITHOUT TIME ZONE) - End time (HH:MM:SS)
- `display_order` (INTEGER) - Order for display (1, 2, 3, ...)
- `timezone` (TEXT) - Optional timezone information

For detailed schema documentation, see: `docs/database-schema.md`

## Implementation Details

### API Changes (`app/api/events/drafts/route.ts`)

The draft save endpoint:

1. Combines main event date with start time → saves to `events.event_date`
2. Combines main event date with end time → saves to `events.end_date`
3. Sets `is_multi_day` flag based on whether additional dates exist
4. For each additional date, inserts a row into `event_dates` table with:
   - Date portion (YYYY-MM-DD)
   - Start time (HH:MM:SS)
   - End time (HH:MM:SS)
   - Display order

### Code Flow

1. User clicks "Save Draft" in the event creation wizard
2. `EventCreationWizard` calls `saveDraft()` from the store
3. Store calls `/api/events/drafts` POST endpoint
4. Endpoint:
   - Combines dates and times for main event → `events.event_date` and `events.end_date`
   - Converts additional dates to proper format
   - Inserts rows into `event_dates` table
   - Saves to `events` table with `status = 'draft'`

## Database Inspection

To check the current database structure, run the SQL queries in:

- `supabase/inspect_events_schema.sql` - Inspects events and event_dates tables
- `supabase/check_database_structure.sql` - Comprehensive database structure check

## Testing

To verify the implementation:

1. Create a new event with dates and times
2. Add additional dates with times
3. Click "Save Draft"
4. Check the database:

   ```sql
   -- Check main event dates
   SELECT
       id,
       title,
       status,
       event_date,
       end_date,
       is_multi_day
   FROM events
   WHERE status = 'draft'
   ORDER BY updated_at DESC
   LIMIT 1;

   -- Check additional dates
   SELECT
       ed.id,
       ed.event_id,
       ed.date,
       ed.start_time,
       ed.end_time,
       ed.display_order
   FROM event_dates ed
   JOIN events e ON ed.event_id = e.id
   WHERE e.status = 'draft'
   ORDER BY e.updated_at DESC, ed.display_order
   LIMIT 10;
   ```

## Related Files

- `app/api/events/drafts/route.ts` - Draft save endpoint
- `app/api/events/route.ts` - Event creation endpoint (also saves dates/times)
- `app/api/events/[id]/route.ts` - Event update endpoint (also saves dates/times)
- `stores/event-creation.ts` - Event creation store with `saveDraft` function
- `components/features/events/EventCreationWizard.tsx` - Wizard component
