-- Add preferences column to profiles table if it doesn't exist
-- This column stores user preferences as JSONB

-- Add preferences column (JSONB type for flexible storage)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.preferences IS 'User preferences stored as JSONB (e.g., role_type, onboarding_completed, etc.)';

-- Create index for better query performance on preferences
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON public.profiles USING gin (preferences);


