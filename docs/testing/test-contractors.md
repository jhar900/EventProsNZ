# Test Contractor Data

This document describes the test contractor data available for local development.

## Overview

The test data includes 10 contractors with varied business types and locations across New Zealand. All test contractors are marked with the `@test.eventpros.local` email domain for easy identification and deletion.

## Test Contractors

1. **Auckland Elite Catering** (Auckland)
   - Email: `catering@test.eventpros.local`
   - Services: Corporate catering, wedding menus, cocktail parties
   - Subscription: Professional
   - Verified: Yes

2. **Capital Photography Co** (Wellington)
   - Email: `photography@test.eventpros.local`
   - Services: Event photography, wedding packages, corporate headshots
   - Subscription: Professional
   - Verified: Yes

3. **Canterbury Sound Systems** (Christchurch)
   - Email: `music@test.eventpros.local`
   - Services: DJ services, wedding music, corporate event music
   - Subscription: Essential
   - Verified: Yes

4. **Waikato Event Venues** (Hamilton)
   - Email: `venue@test.eventpros.local`
   - Services: Conference rooms, wedding venues, gala dinner halls
   - Subscription: Enterprise
   - Verified: Yes

5. **Bay of Plenty Decor** (Tauranga)
   - Email: `decoration@test.eventpros.local`
   - Services: Wedding decoration, corporate styling, themed parties
   - Subscription: Essential
   - Verified: Yes

6. **Southern Blooms** (Dunedin)
   - Email: `florist@test.eventpros.local`
   - Services: Wedding bouquets, event centerpieces, corporate arrangements
   - Subscription: Essential
   - Verified: No

7. **Hawkes Bay Video Productions** (Napier)
   - Email: `videography@test.eventpros.local`
   - Services: Event videography, wedding videos, corporate production
   - Subscription: Professional
   - Verified: Yes

8. **Manawatu Lighting Solutions** (Palmerston North)
   - Email: `lighting@test.eventpros.local`
   - Services: Stage lighting, ambient lighting, special effects
   - Subscription: Essential
   - Verified: Yes

9. **Nelson Budget Catering** (Nelson)
   - Email: `catering2@test.eventpros.local`
   - Services: Casual catering, corporate lunches, morning tea
   - Subscription: Essential
   - Verified: No

10. **Rotorua Entertainment Group** (Rotorua)
    - Email: `entertainment@test.eventpros.local`
    - Services: Live bands, solo performers, interactive entertainment
    - Subscription: Professional
    - Verified: Yes

## Seeding Test Data

### Option 1: Using Node Script (Recommended)

The Node.js script automatically creates auth users and all related data:

```bash
node scripts/seed-test-data.js
```

**Requirements:**

You need to set these environment variables. Create a `.env.local` file in the project root (if it doesn't exist) and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these values:**

1. Go to your Supabase project dashboard
2. Click on **Settings** → **API**
3. Copy the **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the **service_role** key (⚠️ keep this secret!) → use for `SUPABASE_SERVICE_ROLE_KEY`

**Note:** The `.env.local` file is gitignored and won't be committed to the repository. If you already have a `.env.local` file, just add these two variables to it.

This script:

- Creates auth users via Supabase Admin API
- Creates user records, profiles, and business profiles
- Handles existing users gracefully

### Option 2: Using SQL File (Advanced)

**⚠️ Important:** The SQL file requires auth users to be created first via Supabase Admin API or Dashboard, as the `users` table has a foreign key constraint to `auth.users(id)`.

1. First, create auth users for each test contractor email
2. Then open your Supabase SQL Editor
3. Copy and paste the contents of `supabase/seed-test-contractors.sql`
4. Execute the SQL

**Note:** This approach is more complex and not recommended unless you have specific requirements.

## Deleting Test Data

### Option 1: Using SQL File (Recommended)

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `supabase/delete-test-contractors.sql`
3. Execute the SQL

### Option 2: Using Node Script

```bash
node scripts/delete-test-data.js
```

### Option 3: Manual SQL

```sql
DELETE FROM public.users WHERE email LIKE '%@test.eventpros.local';
```

**Note:** Due to CASCADE constraints, deleting users will automatically delete all related data:

- Profiles
- Business profiles
- Services
- Portfolio items
- Testimonials
- Onboarding status
- And other related records

## Safety Features

1. **Email Domain Marking**: All test contractors use `@test.eventpros.local` email domain
2. **Environment Check**: Scripts check for production environment and refuse to run
3. **Easy Identification**: Test data can be easily identified and filtered

## Filtering Test Data in Queries

To exclude test data from queries:

```sql
SELECT * FROM public.users
WHERE email NOT LIKE '%@test.eventpros.local';
```

To only show test data:

```sql
SELECT * FROM public.users
WHERE email LIKE '%@test.eventpros.local';
```

## Data Structure

Each test contractor includes:

- **User record** in `public.users` table
- **Profile** in `public.profiles` table
- **Business profile** in `public.business_profiles` table
- **Services** (3 per contractor) in `public.services` table
- **Portfolio items** (1-2 per contractor) in `public.portfolio` table
- **Testimonials** (some contractors have testimonials) in `public.contractor_testimonials` table

## Notes

- Test contractors have realistic data including names, addresses, phone numbers, and descriptions
- Services have varied price ranges
- Some contractors are verified, others are not
- Different subscription tiers are represented
- Locations span major NZ cities
- Service categories match the available categories in the system
