-- Migration: Remove 'under_review' status from feature_requests table
-- This migration updates the CHECK constraint to remove 'under_review' status

-- First, update any existing feature requests with 'under_review' status to 'submitted'
UPDATE public.feature_requests
SET status = 'submitted'
WHERE status = 'under_review';

-- Drop the existing CHECK constraint
ALTER TABLE public.feature_requests
DROP CONSTRAINT IF EXISTS feature_requests_status_check;

-- Add the new CHECK constraint without 'under_review'
ALTER TABLE public.feature_requests
ADD CONSTRAINT feature_requests_status_check 
CHECK (status IN ('submitted', 'planned', 'in_development', 'completed', 'rejected'));

-- Add comment to document the change
COMMENT ON COLUMN public.feature_requests.status IS 'Status of the feature request: submitted, planned, in_development, completed, or rejected';

