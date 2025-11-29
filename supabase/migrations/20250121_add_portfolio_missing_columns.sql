-- Migration: Create portfolio table and add missing columns
-- Description: Create portfolio table if it doesn't exist, then add video_platform and is_visible columns to match API schema

-- Create portfolio table if it doesn't exist (from 006_contractor_onboarding_tables.sql)
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  event_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add video_platform column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portfolio' AND column_name = 'video_platform'
  ) THEN
    ALTER TABLE portfolio 
    ADD COLUMN video_platform TEXT CHECK (video_platform IN ('youtube', 'vimeo'));
  END IF;
END $$;

-- Add is_visible column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portfolio' AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE portfolio 
    ADD COLUMN is_visible BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Create index for user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);

-- Create index for is_visible for filtering
CREATE INDEX IF NOT EXISTS idx_portfolio_is_visible ON portfolio(is_visible);

-- Update existing rows to have is_visible = true if NULL
UPDATE portfolio 
SET is_visible = TRUE 
WHERE is_visible IS NULL;

-- Enable RLS if not already enabled
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Public can view visible portfolio items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolio' AND policyname = 'Public can view visible portfolio items'
  ) THEN
    CREATE POLICY "Public can view visible portfolio items" ON portfolio
      FOR SELECT USING (is_visible = true);
  END IF;

  -- Users can view their own portfolio (even if not visible)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolio' AND policyname = 'Users can view their own portfolio'
  ) THEN
    CREATE POLICY "Users can view their own portfolio" ON portfolio
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own portfolio items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolio' AND policyname = 'Users can insert their own portfolio items'
  ) THEN
    CREATE POLICY "Users can insert their own portfolio items" ON portfolio
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own portfolio items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolio' AND policyname = 'Users can update their own portfolio items'
  ) THEN
    CREATE POLICY "Users can update their own portfolio items" ON portfolio
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  -- Users can delete their own portfolio items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'portfolio' AND policyname = 'Users can delete their own portfolio items'
  ) THEN
    CREATE POLICY "Users can delete their own portfolio items" ON portfolio
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_portfolio_updated_at'
  ) THEN
    CREATE TRIGGER update_portfolio_updated_at 
      BEFORE UPDATE ON portfolio 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

