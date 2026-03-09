---
title: 'Link Job Postings to Events'
slug: 'link-jobs-to-events'
created: '2026-02-07'
status: 'completed'
stepsCompleted: [1, 2, 3, 4, 5, 6]
tech_stack:
  [
    'Next.js 14',
    'React',
    'TypeScript',
    'Supabase',
    'Zod',
    'React Hook Form',
    'shadcn/ui',
  ]
files_to_modify:
  - 'components/features/jobs/CreateJobModal.tsx'
  - 'components/features/jobs/EditJobModal.tsx'
  - 'components/features/jobs/JobForm.tsx'
  - 'components/features/jobs/JobPreview.tsx'
  - 'app/jobs/[id]/page.tsx'
  - 'lib/jobs/job-service.ts'
  - 'types/jobs.ts'
files_to_create:
  - 'components/features/jobs/EventSelector.tsx'
code_patterns:
  - 'React Hook Form with Zod validation'
  - 'Supabase client for API calls'
  - 'shadcn/ui components (Card, Select, Badge, Dialog)'
  - 'eventData prop pattern in JobForm'
  - 'x-user-id header for auth fallback'
test_patterns:
  - 'Jest + React Testing Library'
  - 'Mock fetch with jest.fn()'
  - 'userEvent for interactions'
  - 'waitFor for async assertions'
---

# Tech-Spec: Link Job Postings to Events

**Created:** 2026-02-07

## Overview

### Problem Statement

Job creators cannot associate their job postings with events they've created. Applicants viewing job postings miss important event context (date, venue, event type) that would help them understand the opportunity.

### Solution

Add an event selector dropdown in CreateJobModal and EditJobModal that fetches the user's events (planning/confirmed status). When an event is selected, auto-populate job fields (title, description, location, dates) which users can adjust. Display linked event information (name, type, date, venue) on the job posting for applicants.

### Scope

**In Scope:**

- EventSelector reusable component (card-based UI, not just dropdown)
- Integration into CreateJobModal and EditJobModal
- Auto-populate job fields from selected event (title, description, location, timeline dates) - user-adjustable
- Visual indicator ("From event" badge) on auto-populated fields
- Job display updates showing linked event info to applicants
- Fetch user's events filtered to planning/confirmed status only
- Empty state UI when user has no events (muted card with prompt to create event)
- Form date/time structure alignment with event creation form

**Out of Scope:**

- Required linking enforcement (linking remains fully optional)
- Draft events in selector
- Changes to existing event_id field handling (already exists in types)
- Events page showing linked jobs (flagged for future separate spec)

## Context for Development

### Codebase Patterns

**Existing Infrastructure:**

- `event_id` field already exists in `JobFormData` (types/jobs.ts:42)
- `event` object already in `JobWithDetails` (types/jobs.ts:104-109)
- `eventData` prop pattern in JobForm (JobForm.tsx:116-124)
- Auto-populate useEffect exists (JobForm.tsx:160-167) - needs expansion for dates
- Event display card exists in job detail page (app/jobs/[id]/page.tsx:247-264) - needs location

**API Patterns:**

- GET /api/events supports `userId` and `status` query params
- Events filtered with `.eq('status', status)` in route handler
- x-user-id header used as auth fallback

**Component Patterns:**

- Modals use Dialog from shadcn/ui
- Forms use React Hook Form + Zod
- Selects use shadcn/ui Select component
- State managed with useState hooks in modal components

### Files to Reference

| File                                                | Purpose                                                         |
| --------------------------------------------------- | --------------------------------------------------------------- |
| components/features/jobs/CreateJobModal.tsx         | Add EventSelector, pass eventData to JobForm                    |
| components/features/jobs/EditJobModal.tsx           | Add EventSelector, load existing event_id                       |
| components/features/jobs/JobForm.tsx                | Expand auto-populate useEffect for dates, add visual indicators |
| components/features/jobs/JobPreview.tsx             | Show linked event in preview                                    |
| app/jobs/[id]/page.tsx                              | Add location to event display card                              |
| lib/jobs/job-service.ts                             | Add location to event select (lines 155-160)                    |
| types/jobs.ts                                       | Add location to JobWithDetails.event type                       |
| app/api/events/route.ts                             | Reference for events API query params                           |
| **tests**/components/features/jobs/JobForm.test.tsx | Test patterns for eventData                                     |

### Technical Decisions

1. **Option B Selected**: Event selector lives in modals, passes eventData prop to JobForm
2. **Card-Based UI**: EventSelector is a prominent card, not just a dropdown - with helper text explaining benefit
3. **Empty State**: When user has no events, show muted/less prominent card with "Create an event to link" prompt
4. **Event Filtering**: Only show events with status 'planning' or 'confirmed'
5. **Auto-populate Fields**: title, description, location, timeline_start_date, timeline_end_date (plus multi-date support)
6. **Visual Indicator**: Auto-populated fields show "From event" badge/highlight
7. **Location Addition**: Add event.location to both type definition and Supabase select
8. **Re-fetch Strategy**: Re-fetch events on dropdown open (if performant) to handle stale data

## Implementation Plan

### Tasks

- [x] Task 0: Verify events schema (PRE-IMPLEMENTATION)
  - Action: Confirm `end_date` exists in events table
  - Action: Verify all date/time fields available for multi-date events
  - Action: Check if events API response includes `end_date` - if not, add to select
  - Notes: Must complete before Task 4 implementation

- [x] Task 1: Add location to event type definition
  - File: `types/jobs.ts`
  - Action: Add `location: string;` to the `event` object in `JobWithDetails` interface (lines 104-109)
  - Notes: This enables TypeScript support for event location in job display

- [x] Task 2: Add location to job-service event select
  - File: `lib/jobs/job-service.ts`
  - Action: Add `location` to the event select query (lines 155-160)
  - Change from:
    ```
    event:events!jobs_event_id_fkey(
      id,
      title,
      event_type,
      event_date
    )
    ```
  - Change to:
    ```
    event:events!jobs_event_id_fkey(
      id,
      title,
      event_type,
      event_date,
      location
    )
    ```

- [x] Task 3: Create EventSelector component
  - File: `components/features/jobs/EventSelector.tsx` (NEW)
  - Action: Create card-based event selector component that:
    - Fetches user's events via GET /api/events with status filter (planning, confirmed)
    - Re-fetches events on dropdown open (for stale data handling, if performant)
    - Displays as prominent Card with helper text: "Link to an event to show applicants event details"
    - Contains Select dropdown with event title and date
    - Includes "No event" / "Remove event link" option
    - Calls onSelect callback with full event data when selected
    - Shows loading state while fetching
    - **Empty state**: When user has no events, show muted/less prominent card with "Create an event first to link this job" prompt
  - Props interface:
    ```typescript
    interface EventSelectorProps {
      userId: string;
      selectedEventId?: string;
      onSelect: (event: EventData | null) => void;
    }
    ```

- [x] Task 4: Expand JobForm auto-populate for dates
  - File: `components/features/jobs/JobForm.tsx`
  - Action: Update useEffect at lines 160-167 to also populate timeline dates
  - Current:
    ```typescript
    if (eventData && useEventData) {
      setValue('title', `Event Manager for ${eventData.title}`);
      setValue('description', eventData.description || '');
      setValue('location', eventData.location);
      setValue('event_id', eventData.id);
    }
    ```
  - Add:
    ```typescript
    if (eventData.event_date) {
      setValue('timeline_start_date', eventData.event_date.split('T')[0]);
    }
    if (eventData.end_date) {
      setValue('timeline_end_date', eventData.end_date.split('T')[0]);
    }
    ```
  - Also update eventData prop interface to include `end_date?: string`

- [x] Task 5: Add visual indicator for auto-populated fields
  - File: `components/features/jobs/JobForm.tsx`
  - Action: Add state to track which fields were auto-populated from event
  - Action: Add subtle "From event" Badge or highlight styling to auto-populated fields
  - Notes: Indicator should clear if user manually edits the field

- [x] Task 6: Integrate EventSelector into CreateJobModal
  - File: `components/features/jobs/CreateJobModal.tsx`
  - Actions:
    1. Add state: `const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)`
    2. Add EventSelector card above JobForm in the 'form' step
    3. Pass `eventData={selectedEvent}` to JobForm
  - Notes: EventSelector handles its own event fetching

- [x] Task 7: Integrate EventSelector into EditJobModal
  - File: `components/features/jobs/EditJobModal.tsx`
  - Actions:
    1. Add state for selectedEvent
    2. Initialize selectedEvent from job.event data on modal open (if job has event_id)
    3. Add EventSelector component above JobForm
    4. Pass eventData to JobForm
  - Notes: Pre-select existing event if job has event_id

- [x] Task 8: Add event info to JobPreview
  - File: `components/features/jobs/JobPreview.tsx`
  - Actions:
    1. Add optional `eventData` prop to JobPreviewProps interface
    2. Add event info card after job description section (similar to job detail page pattern)
    3. Display: event title, type, date, location
    4. Use blue-50 background card styling (matching job detail page)
  - Notes: Only render if eventData is provided

- [x] Task 9: Add location to job detail event display
  - File: `app/jobs/[id]/page.tsx`
  - Action: Add location to the event display card (lines 247-264)
  - Current display: `{job.event.title}`, `{job.event.event_type}`, `{formatDate(job.event.event_date)}`
  - Add: `{job.event.location}` below event date
  - Use MapPin icon for consistency

- [x] Task 10: Update CreateJobModal to pass eventData to JobPreview
  - File: `components/features/jobs/CreateJobModal.tsx`
  - Action: Pass `eventData={selectedEvent}` to JobPreview component in preview step
  - Notes: Allows preview to show linked event before submission

- [x] Task 11: Update EditJobModal to pass eventData to JobPreview
  - File: `components/features/jobs/EditJobModal.tsx`
  - Action: Pass `eventData={selectedEvent}` to JobPreview component
  - Notes: Allows preview to show linked event during edit

- [x] Task 12: Adjust form date/time structure for multi-date events
  - File: `components/features/jobs/JobForm.tsx`
  - Action: Update timeline section to support displaying multiple dates/times when event has them
  - Action: Align structure with event creation form date/time pattern
  - Notes: May require additional eventData fields for multi-date events

- [x] Task 13: Add tests for EventSelector component
  - File: `__tests__/components/features/jobs/EventSelector.test.tsx` (NEW)
  - Tests:
    - Renders loading state initially
    - Displays events after fetch
    - Handles empty events state with appropriate messaging
    - Calls onSelect when event selected
    - Calls onSelect with null when "No event" selected
    - Shows muted card when no events available

- [x] Task 14: Update JobForm tests for date auto-populate and visual indicators
  - File: `__tests__/components/features/jobs/JobForm.test.tsx`
  - Action: Add test case for timeline date auto-population from eventData
  - Action: Add test for "From event" visual indicator on auto-populated fields
  - Pattern: Follow existing test at lines 135-169

### Acceptance Criteria

- [x] AC 1: Given a user is creating a job, when they open the Create Job modal, then they see an event selector card above the form with helper text
- [x] AC 2: Given a user has events with status 'planning' or 'confirmed', when they open the event selector, then only those events appear in the dropdown
- [x] AC 3: Given a user has no events, when they see the EventSelector, then it shows muted card with "Create an event to link" prompt
- [x] AC 4: Given a user selects an event, when they check "Use details from event", then title, description, location, and timeline dates are auto-populated
- [x] AC 5: Given fields are auto-populated from event, when user views the form, then those fields show "From event" visual indicator
- [x] AC 6: Given auto-populated fields, when the user modifies any field, then the modified value is preserved and visual indicator clears
- [x] AC 7: Given a user is editing a job with a linked event, when they open the Edit Job modal, then the existing event is pre-selected
- [x] AC 8: Given a job is linked to an event, when viewing the job preview, then the linked event info (title, type, date, location) is displayed
- [x] AC 9: Given a job is linked to an event, when an applicant views the job detail page, then the event info including location is displayed
- [x] AC 10: Given a user creates a job without selecting an event, when the job is saved, then event_id is null and job saves successfully
- [x] AC 11: Given a user removes an event link during edit (selects "No event"), when they save, then event_id is set to null
- [x] AC 12: Given event has multiple dates/times, when auto-populating, then form displays all event dates in timeline section

## Additional Context

### Dependencies

- GET /api/events endpoint (existing) - fetches user's events with status filter
- JobForm eventData prop pattern (existing) - receives event data from parent
- job-service.ts event join (existing) - fetches event data with job
- shadcn/ui Select and Card components (existing) - used for UI
- Events table schema - must have end_date field (verify in Task 0)

### Testing Strategy

**Unit Tests:**

- EventSelector component: loading, display, selection, empty state, muted card state
- JobForm: date auto-populate from eventData, visual indicator behavior

**Integration Tests:**

- CreateJobModal + EventSelector: event selection flows to JobForm
- EditJobModal + EventSelector: existing event pre-selection

**Manual Testing:**

1. Create job without event - verify saves successfully
2. Create job with event - verify auto-populate, visual indicators, and save
3. Edit job, change event - verify update
4. Edit job, remove event - verify event_id cleared
5. View job as applicant - verify event info displays with location
6. Open modal with no events - verify muted card and prompt
7. Modify auto-populated field - verify indicator clears

### Notes

**Implementation Order:**

- Task 0 (schema verification) must complete FIRST
- Tasks 1-2 (types/backend) must complete before Tasks 3-12 (frontend) can be fully tested

**Risk Items:**

- Events API may return large datasets - consider adding limit to EventSelector query
- Event selector should gracefully handle API errors
- Re-fetch on dropdown open should be tested for performance impact

**Future Considerations (Out of Scope - Separate Specs):**

- Events page showing linked jobs for easier management
- Filtering events by date (only show future events)
- Showing event status badge in selector
- Deep linking from job to event detail page

## Review Notes

- Adversarial review completed: 2026-02-07
- Findings: 10 total, 7 fixed, 3 skipped (noise/uncertain)
- Resolution approach: auto-fix

**Fixes Applied:**

- F1 (High): Removed redundant client-side event status filter - API already filters
- F2 (Medium): Reverted unrelated JobCard bookmark removal (scope creep)
- F3 (Medium): Added AbortController for fetch cleanup on unmount
- F4 (Medium): Consolidated EventData type - JobPreview now imports from EventSelector
- F5 (Low): Added afterAll cleanup to restore global.fetch in tests
- F9 (Low): Added 5-second debounce to prevent rapid re-fetches on dropdown open

**Skipped (noise/uncertain):**

- F6: EditJobModal type change is intentional (needs JobWithDetails for event data)
- F8: Budget type imports are unrelated pre-existing code
- F10: Test assertion is sufficient for coverage
