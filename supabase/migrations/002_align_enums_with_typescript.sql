-- Align database enums with TypeScript types
-- This migration updates enum values to match our TypeScript definitions

-- Update event_status enum
ALTER TYPE event_status RENAME TO event_status_old;
CREATE TYPE event_status AS ENUM ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled');

-- Update events table to use new enum
ALTER TABLE public.events ALTER COLUMN status TYPE event_status USING 
  CASE status::text
    WHEN 'draft' THEN 'planning'::event_status
    WHEN 'planning' THEN 'planning'::event_status
    WHEN 'confirmed' THEN 'confirmed'::event_status
    WHEN 'completed' THEN 'completed'::event_status
    WHEN 'cancelled' THEN 'cancelled'::event_status
    ELSE 'planning'::event_status
  END;

-- Update job_status enum
ALTER TYPE job_status RENAME TO job_status_old;
CREATE TYPE job_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- Update jobs table to use new enum
ALTER TABLE public.jobs ALTER COLUMN status TYPE job_status USING 
  CASE status::text
    WHEN 'active' THEN 'open'::job_status
    WHEN 'filled' THEN 'completed'::job_status
    WHEN 'completed' THEN 'completed'::job_status
    WHEN 'cancelled' THEN 'cancelled'::job_status
    ELSE 'open'::job_status
  END;

-- Update subscription_tier enum
ALTER TYPE subscription_tier RENAME TO subscription_tier_old;
CREATE TYPE subscription_tier AS ENUM ('essential', 'professional', 'enterprise');

-- Update business_profiles table to use new enum
ALTER TABLE public.business_profiles ALTER COLUMN subscription_tier TYPE subscription_tier USING 
  CASE subscription_tier::text
    WHEN 'essential' THEN 'essential'::subscription_tier
    WHEN 'showcase' THEN 'professional'::subscription_tier
    WHEN 'spotlight' THEN 'enterprise'::subscription_tier
    ELSE 'essential'::subscription_tier
  END;

-- Update subscriptions table to use new enum
ALTER TABLE public.subscriptions ALTER COLUMN tier TYPE subscription_tier USING 
  CASE tier::text
    WHEN 'essential' THEN 'essential'::subscription_tier
    WHEN 'showcase' THEN 'professional'::subscription_tier
    WHEN 'spotlight' THEN 'enterprise'::subscription_tier
    ELSE 'essential'::subscription_tier
  END;

-- Update enquiry_status enum
ALTER TYPE enquiry_status RENAME TO enquiry_status_old;
CREATE TYPE enquiry_status AS ENUM ('pending', 'accepted', 'declined', 'withdrawn');

-- Update enquiries table to use new enum
ALTER TABLE public.enquiries ALTER COLUMN status TYPE enquiry_status USING 
  CASE status::text
    WHEN 'pending' THEN 'pending'::enquiry_status
    WHEN 'responded' THEN 'accepted'::enquiry_status
    WHEN 'closed' THEN 'declined'::enquiry_status
    WHEN 'archived' THEN 'withdrawn'::enquiry_status
    ELSE 'pending'::enquiry_status
  END;

-- Drop old enum types
DROP TYPE event_status_old;
DROP TYPE job_status_old;
DROP TYPE subscription_tier_old;
DROP TYPE enquiry_status_old;
