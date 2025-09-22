-- Enhance data validation and constraints
-- This migration adds additional validation rules and constraints

-- Add email format validation
ALTER TABLE public.users ADD CONSTRAINT valid_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add phone number format validation (NZ format)
ALTER TABLE public.profiles ADD CONSTRAINT valid_phone_format 
  CHECK (phone IS NULL OR phone ~* '^(\+64|0)[2-9][0-9]{7,9}$');

-- Add NZBN validation for business profiles (if needed)
-- ALTER TABLE public.business_profiles ADD COLUMN nzbn TEXT;
-- ALTER TABLE public.business_profiles ADD CONSTRAINT valid_nzbn_format 
--   CHECK (nzbn IS NULL OR nzbn ~* '^[0-9]{13}$');

-- Add budget validation constraints
ALTER TABLE public.events ADD CONSTRAINT valid_budget_range 
  CHECK (budget >= 0 AND budget <= 1000000);

-- Add attendee count validation
ALTER TABLE public.events ADD CONSTRAINT valid_attendee_count 
  CHECK (attendee_count > 0 AND attendee_count <= 10000);

-- Add duration validation
ALTER TABLE public.events ADD CONSTRAINT valid_duration 
  CHECK (duration_hours > 0 AND duration_hours <= 168); -- Max 1 week

-- Add rating validation for testimonials
ALTER TABLE public.testimonials ADD CONSTRAINT valid_rating 
  CHECK (rating >= 1 AND rating <= 5);

-- Add price range validation for services
ALTER TABLE public.services ADD CONSTRAINT valid_service_price_range 
  CHECK (
    price_range_min IS NULL OR 
    price_range_max IS NULL OR 
    (price_range_min >= 0 AND price_range_max >= price_range_min)
  );

-- Add budget validation for job applications
ALTER TABLE public.job_applications ADD CONSTRAINT valid_proposed_budget 
  CHECK (proposed_budget IS NULL OR proposed_budget >= 0);

-- Add application deadline validation for jobs
ALTER TABLE public.jobs ADD CONSTRAINT valid_application_deadline 
  CHECK (application_deadline IS NULL OR application_deadline > created_at);

-- Add subscription expiration validation
ALTER TABLE public.subscriptions ADD CONSTRAINT valid_subscription_dates 
  CHECK (expires_at IS NULL OR expires_at > started_at);

-- Add website URL validation
ALTER TABLE public.business_profiles ADD CONSTRAINT valid_website_url 
  CHECK (website IS NULL OR website ~* '^https?://[^\s/$.?#].[^\s]*$');

-- Add location validation (basic)
ALTER TABLE public.events ADD CONSTRAINT valid_location 
  CHECK (location IS NOT NULL AND length(trim(location)) > 0);

-- Add title validation for events
ALTER TABLE public.events ADD CONSTRAINT valid_event_title 
  CHECK (title IS NOT NULL AND length(trim(title)) > 0 AND length(title) <= 200);

-- Add company name validation
ALTER TABLE public.business_profiles ADD CONSTRAINT valid_company_name 
  CHECK (company_name IS NOT NULL AND length(trim(company_name)) > 0 AND length(company_name) <= 100);

-- Add name validation for profiles
ALTER TABLE public.profiles ADD CONSTRAINT valid_first_name 
  CHECK (first_name IS NOT NULL AND length(trim(first_name)) > 0 AND length(first_name) <= 50);

ALTER TABLE public.profiles ADD CONSTRAINT valid_last_name 
  CHECK (last_name IS NOT NULL AND length(trim(last_name)) > 0 AND length(last_name) <= 50);
