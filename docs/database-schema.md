# Database Schema Documentation

This document describes the database schema for the EventProsNZ application, specifically focusing on event-related tables. This documentation is kept in sync with the actual Supabase database structure.

## Events Table

The `events` table stores the main event information.

### Schema

| Column Name      | Data Type                | Nullable | Description                                                                                  |
| ---------------- | ------------------------ | -------- | -------------------------------------------------------------------------------------------- |
| `id`             | UUID                     | NO       | Primary key                                                                                  |
| `user_id`        | UUID                     | YES      | Foreign key to `users(id)`                                                                   |
| `title`          | TEXT                     | YES      | Event title                                                                                  |
| `event_type`     | TEXT                     | NO       | Type of event (e.g., 'wedding', 'corporate', 'party')                                        |
| `event_date`     | TIMESTAMP WITH TIME ZONE | YES      | Main event date and start time                                                               |
| `end_date`       | TIMESTAMP WITH TIME ZONE | YES      | End date and end time (for same-day events or multi-day events)                              |
| `is_multi_day`   | BOOLEAN                  | YES      | Indicates if the event spans multiple days                                                   |
| `location`       | TEXT                     | YES      | Event location address (plain text)                                                          |
| `attendee_count` | INTEGER                  | YES      | Number of expected attendees                                                                 |
| `duration_hours` | NUMERIC                  | YES      | Event duration in hours                                                                      |
| `budget`         | NUMERIC                  | YES      | Total event budget                                                                           |
| `status`         | USER-DEFINED             | YES      | Event status enum: 'draft', 'planning', 'confirmed', 'in_progress', 'completed', 'cancelled' |
| `description`    | TEXT                     | YES      | Event description                                                                            |
| `requirements`   | TEXT                     | YES      | Special requirements or notes                                                                |
| `created_at`     | TIMESTAMP WITH TIME ZONE | YES      | Record creation timestamp                                                                    |
| `updated_at`     | TIMESTAMP WITH TIME ZONE | YES      | Record last update timestamp                                                                 |
| `draft_step`     | INTEGER                  | YES      | Current step in draft creation process                                                       |
| `logo_url`       | TEXT                     | YES      | URL to event logo image                                                                      |

### Notes

- **Main Event Date/Time**: The `event_date` column stores the main event date combined with the start time as a timestamp. The `end_date` column stores the end date/time.
- **Multi-day Events**: When `is_multi_day` is `true`, additional dates are stored in the `event_dates` table (see below).
- **Draft Events**: Events with `status = 'draft'` are considered draft events and may have incomplete data.

## Event Dates Table

The `event_dates` table stores additional dates for multi-day events. Each row represents one additional day with its start and end times.

### Schema

| Column Name     | Data Type                | Nullable | Description                                             |
| --------------- | ------------------------ | -------- | ------------------------------------------------------- |
| `id`            | UUID                     | NO       | Primary key                                             |
| `event_id`      | UUID                     | NO       | Foreign key to `events(id)`                             |
| `date`          | DATE                     | NO       | The date for this additional day (YYYY-MM-DD)           |
| `start_time`    | TIME WITHOUT TIME ZONE   | NO       | Start time for this day (HH:MM:SS)                      |
| `end_time`      | TIME WITHOUT TIME ZONE   | NO       | End time for this day (HH:MM:SS)                        |
| `timezone`      | TEXT                     | YES      | Timezone for this date (e.g., 'Pacific/Auckland')       |
| `description`   | TEXT                     | YES      | Optional description for this specific date             |
| `display_order` | INTEGER                  | NO       | Order in which dates should be displayed (1, 2, 3, ...) |
| `created_at`    | TIMESTAMP WITH TIME ZONE | YES      | Record creation timestamp                               |
| `updated_at`    | TIMESTAMP WITH TIME ZONE | YES      | Record last update timestamp                            |

### Notes

- **Relationship**: Each row in `event_dates` is linked to an event via `event_id`.
- **Display Order**: The `display_order` column ensures dates are displayed in chronological order.
- **Time Format**: Times are stored as `TIME WITHOUT TIME ZONE` in HH:MM:SS format.
- **Date Format**: Dates are stored as `DATE` in YYYY-MM-DD format.

## Data Storage Pattern

### Main Event Date/Time

For the main event:

- **Date + Start Time** → Stored in `events.event_date` (TIMESTAMP WITH TIME ZONE)
- **Date + End Time** → Stored in `events.end_date` (TIMESTAMP WITH TIME ZONE)

Example:

```sql
-- Main event: January 15, 2024, 10:00 AM - 6:00 PM
event_date = '2024-01-15 10:00:00+00:00'
end_date = '2024-01-15 18:00:00+00:00'
```

### Additional Dates

For additional dates (multi-day events), each additional day is stored as a separate row in `event_dates`:

```sql
-- Additional day 1: January 16, 2024, 9:00 AM - 5:00 PM
INSERT INTO event_dates (event_id, date, start_time, end_time, display_order)
VALUES ('event-uuid', '2024-01-16', '09:00:00', '17:00:00', 1);

-- Additional day 2: January 17, 2024, 10:00 AM - 4:00 PM
INSERT INTO event_dates (event_id, date, start_time, end_time, display_order)
VALUES ('event-uuid', '2024-01-17', '10:00:00', '16:00:00', 2);
```

## API Implementation

### Saving Dates and Times

When saving an event (draft or final):

1. **Main Event**: Combine date and start time → `events.event_date`, combine date and end time → `events.end_date`
2. **Additional Dates**: For each additional date, insert a row into `event_dates` with:
   - `date`: Date portion (YYYY-MM-DD)
   - `start_time`: Time portion (HH:MM:SS)
   - `end_time`: Time portion (HH:MM:SS)
   - `display_order`: Sequential order (1, 2, 3, ...)

### Loading Dates and Times

When loading an event:

1. **Main Event**: Extract date and time from `events.event_date` and `events.end_date`
2. **Additional Dates**: Query `event_dates` table filtered by `event_id`, ordered by `display_order`

## Related Tables

- `event_service_requirements` - Service requirements for events
- `event_versions` - Version history for events
- `event_contractor_matches` - Contractor matches for events
- `event_notifications` - Notifications related to events

## Migration History

- Initial schema created in `001_initial_schema_with_performance.sql`
- Event creation tables added in `011_event_creation_tables.sql`
- Draft support added in `20250127_update_events_for_drafts.sql`
- Logo URL added in `20250130_add_logo_url_to_events.sql`

## SQL Inspection Queries

To inspect the current schema, use the queries in:

- `supabase/inspect_events_schema.sql` - Inspects events and event_dates tables
- `supabase/check_database_structure.sql` - Comprehensive database structure check
